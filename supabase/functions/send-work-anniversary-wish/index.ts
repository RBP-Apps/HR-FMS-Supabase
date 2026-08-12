// Deno Edge Function for sending WhatsApp Work Anniversary wishes using Meta WhatsApp Business API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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
    const bodyData = await req.json().catch(() => ({}));
    const { phone, name, years, message, templateName, languageCode, imageUrl, autoCron } = bodyData;

    // Handle 12:01 AM Daily Automated Cron Trigger for Work Anniversaries
    if (autoCron) {
      console.log("Executing 12:01 AM Daily Automated Work Anniversary Wish Dispatch Job...");
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Supabase service credentials missing for autoCron execution.");
      }

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: employees, error: empErr } = await supabaseAdmin
        .from("joining")
        .select("*")
        .eq("status", "Active");

      if (empErr) throw empErr;

      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentDate = today.getDate();
      const currentYear = today.getFullYear();

      const todayAnnivEmps = (employees || []).filter((emp) => {
        if (!emp.date_of_joining) return false;
        const str = String(emp.date_of_joining).trim();
        let dojMonth = null;
        let dojDate = null;

        if (str.includes("/")) {
          const parts = str.split("/");
          if (parts.length === 3) {
            dojDate = parseInt(parts[0], 10);
            dojMonth = parseInt(parts[1], 10);
          }
        } else if (str.includes("-")) {
          const parts = str.split("-");
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              dojMonth = parseInt(parts[1], 10);
              dojDate = parseInt(parts[2], 10);
            } else {
              dojDate = parseInt(parts[0], 10);
              dojMonth = parseInt(parts[1], 10);
            }
          }
        } else {
          const d = new Date(str);
          if (!isNaN(d.getTime())) {
            dojMonth = d.getMonth() + 1;
            dojDate = d.getDate();
          }
        }

        return dojMonth === currentMonth && dojDate === currentDate;
      });

      console.log(`Found ${todayAnnivEmps.length} Work Anniversary milestone(s) today.`);

      const results = [];
      const activeTemplate = templateName || "work_anniversary_wish";

      for (const emp of todayAnnivEmps) {
        const empName = emp.name_as_per_aadhar || "Employee";
        let targetPhone = emp.mobile_number || emp.family_number || "";
        targetPhone = targetPhone.replace(/\D/g, "");

        if (!targetPhone) {
          console.warn(`No phone number for ${empName}`);
          continue;
        }

        if (targetPhone.length === 10) {
          targetPhone = "91" + targetPhone;
        }

        // Calculate completed years
        let dojYear = currentYear;
        const str = String(emp.date_of_joining);
        if (str.includes("/")) dojYear = parseInt(str.split("/")[2], 10) || currentYear;
        else if (str.includes("-")) dojYear = parseInt(str.split("-")[0], 10) || currentYear;

        const yrs = Math.max(1, currentYear - dojYear);

        const customMessage = `🎉 Happy Work Anniversary, ${empName}!\n${yrs} years of shining together — thank you for your dedication, energy and commitment to RBP.\nHere’s to many more milestones ahead.\nWarm wishes, Team RBP — Committed to Empower & Shine`;

        const payload = {
          messaging_product: "whatsapp",
          to: targetPhone,
          type: "template",
          template: {
            name: activeTemplate,
            language: { code: languageCode || "en_US" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: empName },
                  { type: "text", text: String(yrs) }
                ]
              }
            ]
          }
        };

        const resp = await fetch(
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

        const respData = await resp.json();
        results.push({ name: empName, phone: targetPhone, success: resp.ok, respData });

        // Log to database table `work_anniversary_wish`
        await supabaseAdmin.from("work_anniversary_wish").insert([{
          employee_name: empName,
          employee_code: emp.rbp_joining_id || "",
          mobile_number: targetPhone,
          joining_date: emp.date_of_joining || "",
          years_completed: yrs,
          wish_date: today.toISOString().split("T")[0],
          message: customMessage,
          template_name: activeTemplate,
          sent_by: "Auto Cron (12:01 AM)",
          timestamp: new Date().toISOString()
        }]);
      }

      return new Response(
        JSON.stringify({ success: true, count: results.length, results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Standard Single Dispatch Request
    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.replace(/^0+/, "");
    }
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    const activeTemplate = templateName || "work_anniversary_wish";
    const yrsCount = years || "1";
    console.log(`Sending Work Anniversary WhatsApp to ${cleanPhone} (Name: ${name || "N/A"}, Years: ${yrsCount}, Template: ${activeTemplate}, Image: ${imageUrl ? "Yes" : "No"})`);

    let payload: any;
    if (activeTemplate) {
      const components: any[] = [];

      // Image header component if provided
      if (imageUrl) {
        components.push({
          type: "header",
          parameters: [
            {
              type: "image",
              image: { link: imageUrl }
            }
          ]
        });
      }

      // Body parameters {{1}} = Employee Name, {{2}} = Years Completed
      components.push({
        type: "body",
        parameters: [
          {
            type: "text",
            text: (name || "Valued Team Member").replace(/[\r\n]+/g, " ").trim()
          },
          {
            type: "text",
            text: String(yrsCount).trim()
          }
        ]
      });

      payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: activeTemplate,
          language: {
            code: languageCode || "en_US"
          },
          components: components
        }
      };
    } else if (imageUrl) {
      payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "image",
        image: {
          link: imageUrl,
          caption: message || `Happy Work Anniversary, ${name || "Team Member"}!`
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

    // Call Meta WhatsApp Business Cloud API using registered template
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
    console.error("Error sending Work Anniversary WhatsApp message:", error);
    return new Response(
      JSON.stringify({ error: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
