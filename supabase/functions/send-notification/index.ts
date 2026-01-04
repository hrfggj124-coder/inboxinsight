import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Resend SDK replacement - using fetch directly
const sendEmail = async (apiKey: string, options: { from: string; to: string[]; subject: string; html: string }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
  
  return response.json();
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "article_approved" | "article_rejected" | "new_comment";
  recipient_user_id: string;
  article_id?: string;
  article_title?: string;
  comment_content?: string;
  commenter_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    // If no Resend API key, log and return success (notifications are optional)
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "Email notifications not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, recipient_user_id, article_id, article_title, comment_content, commenter_name }: NotificationRequest = await req.json();

    // Get recipient's email and notification preferences
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(recipient_user_id);
    
    if (userError || !userData?.user?.email) {
      console.error("Failed to get user email:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const recipientEmail = userData.user.email;

    // Check notification preferences
    const { data: settings } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", recipient_user_id)
      .maybeSingle();

    // Default to enabled if no settings exist
    const prefs = settings || {
      email_on_approval: true,
      email_on_rejection: true,
      email_on_comment: true,
    };

    // Check if notification type is enabled
    if (type === "article_approved" && !prefs.email_on_approval) {
      return new Response(
        JSON.stringify({ success: true, message: "Notification disabled by user" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (type === "article_rejected" && !prefs.email_on_rejection) {
      return new Response(
        JSON.stringify({ success: true, message: "Notification disabled by user" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (type === "new_comment" && !prefs.email_on_comment) {
      return new Response(
        JSON.stringify({ success: true, message: "Notification disabled by user" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build email content based on type
    let subject = "";
    let html = "";

    switch (type) {
      case "article_approved":
        subject = `Your article "${article_title}" has been approved!`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10B981;">Good news! 🎉</h1>
            <p>Your article <strong>"${article_title}"</strong> has been approved and is now live on the site.</p>
            <p>Thank you for your contribution!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">You received this email because you have article approval notifications enabled.</p>
          </div>
        `;
        break;

      case "article_rejected":
        subject = `Update on your article "${article_title}"`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #EF4444;">Article Review Update</h1>
            <p>Unfortunately, your article <strong>"${article_title}"</strong> was not approved at this time.</p>
            <p>Please review our guidelines and feel free to make revisions and resubmit.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">You received this email because you have article rejection notifications enabled.</p>
          </div>
        `;
        break;

      case "new_comment":
        subject = `New comment on "${article_title}"`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3B82F6;">New Comment! 💬</h1>
            <p><strong>${commenter_name || "Someone"}</strong> commented on your article <strong>"${article_title}"</strong>:</p>
            <blockquote style="border-left: 3px solid #3B82F6; padding-left: 15px; margin: 20px 0; color: #555;">
              ${comment_content?.substring(0, 200)}${(comment_content?.length || 0) > 200 ? "..." : ""}
            </blockquote>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">You received this email because you have comment notifications enabled.</p>
          </div>
        `;
        break;
    }

    // Send email
    const emailResponse = await sendEmail(resendApiKey, {
      from: "TechPulse <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log notification to queue
    await supabase.from("notification_queue").insert({
      recipient_user_id,
      notification_type: type,
      subject,
      body: html,
      metadata: { article_id, article_title },
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
