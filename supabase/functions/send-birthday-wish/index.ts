// Deno Edge Function for sending WhatsApp Birthday wishes using Meta WhatsApp Business API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, name, message, templateName, languageCode } = await req.json();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: "Phone number and message are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number: remove non-digit characters
    let cleanPhone = phone.replace(/\D/g, "");

    // Remove leading zeros if present
    if (cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.replace(/^0+/, "");
    }

    // If it has 10 digits (common for Indian numbers), prepend '91' country code
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    console.log(`Sending WhatsApp to ${cleanPhone} (Name: ${name || "N/A"})`);

    let payload;
    if (templateName) {
      payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode || "en_US"
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: (name || "Employee").replace(/[\r\n]+/g, " ").trim()
                },
                {
                  type: "text",
                  text: (message || "").replace(/[\r\n]+/g, " ").trim()
                }
              ]
            }
          ]
        }
      };
    } else {
      payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: {
          body: message
        }
      };
    }

    // Call Meta WhatsApp Business Cloud API using a registered template
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error("Meta API Error response:", data);
      throw new Error(data.error?.message || "Failed to send WhatsApp message via Meta Cloud API.");
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
