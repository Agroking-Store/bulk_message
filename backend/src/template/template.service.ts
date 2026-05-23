import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class TemplateService {

  private localTemplates: any[] = [];


  async createTemplate(data: any) {
    try {

      console.log(" FINAL DATA GOING TO META:");
      console.log(JSON.stringify(data, null, 2));

      const bodyComp = data?.components?.find((c: any) => c.type === 'BODY');
      if (!bodyComp?.text) {
        console.log(" BODY TEXT MISSING:", data);
        return {
          success: false,
          message: "Body text is missing ",
        };
      }

      const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;


      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      console.log(" Meta Response:", response.data);



      const bodyComponent = data.components?.find((c: any) => c.type === 'BODY');
      const newTemplate = {
        id: response.data.id,
        name: data.name,
        status: "PENDING",
        category: data.category,
        language: data.language,
        bodyText: bodyComponent?.text || '',
        components: data.components,
        createdAt: new Date(),
      };

      this.localTemplates.push(newTemplate);

      console.log(" LOCAL TEMPLATES:", this.localTemplates);

      return {
        success: true,
        message: "Template sent for approval ",
      };

    } catch (error: any) {
      console.log(" META ERROR:", error.response?.data);

      return {
        success: false,
        message: error.response?.data || "Meta error",
      };
    }
  }

  async uploadMediaToMeta(file: Express.Multer.File, type: string) {
    try {
      if (!process.env.WHATSAPP_APP_ID) {
        throw new Error("WHATSAPP_APP_ID is not configured in .env");
      }
      
      console.log(` Starting Resumable Upload for App ID: ${process.env.WHATSAPP_APP_ID}`);
      const sessionIdUrl = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_APP_ID}/uploads?file_length=${file.size}&file_type=${file.mimetype}`;

      // 1. Create upload session
      const sessionResponse = await axios.post(
        sessionIdUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      const sessionId = sessionResponse.data.id;
      if (!sessionId) throw new Error("Failed to create upload session from Meta.");

      console.log(` Created session ID: ${sessionId}, uploading bytes...`);

      // 2. Upload bytes
      const uploadUrl = `https://graph.facebook.com/v20.0/${sessionId}`;
      
      const uploadResponse = await axios.post(
        uploadUrl,
        file.buffer,
        {
          headers: {
            Authorization: `OAuth ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            file_offset: 0,
          },
        }
      );

      console.log(" Upload complete. Meta Handle ID:", uploadResponse.data.h);
      return { success: true, h: uploadResponse.data.h };

    } catch (error: any) {
      console.error(" META UPLOAD ERROR:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Failed to upload media to Meta");
    }
  }


  async syncTemplatesFromMeta() {
    try {
      console.log(" Fetching templates from Meta...");

      const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      });

      const metaTemplates = response.data.data;

      const formatted = metaTemplates.map((t: any) => {
        const bodyComponent = t.components?.find((c: any) => c.type === 'BODY');
        return {
          id: t.id,
          name: t.name,
          status: t.status,
          category: t.category,
          language: t.language,
          bodyText: bodyComponent?.text || '',
          components: t.components,
        };
      });
      console.log(" META TEMPLATES:", formatted);

      return formatted;

    } catch (error: any) {
      console.log(" FETCH ERROR:", error.response?.data);
      return [];
    }
  }

  updateTemplateStatus(templateId: string, status: string) {
    console.log(" Webhook Status:", templateId, status);

    const template = this.localTemplates.find(
      (t) => t.id === templateId
    );

    if (template) {
      template.status = status;
      console.log(" UPDATED LOCAL STATUS:", template);
    }
  }


  async getTemplates() {
    const metaTemplates = await this.syncTemplatesFromMeta();

    const allTemplates = [...this.localTemplates];

    metaTemplates.forEach((meta) => {
      const existing = allTemplates.find((t) => t.id === meta.id);

      if (existing) {
        existing.status = meta.status;
        existing.bodyText = meta.bodyText;
        existing.components = meta.components;
      } else {
        allTemplates.push(meta);
      }
    });

    console.log(" FINAL MERGED DATA:", allTemplates);

    return allTemplates;
  }

  async deleteTemplate(name: string) {
    try {
      console.log(`🗑️ Deleting template: ${name}`);

      const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?name=${name}`;

      const response = await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      });

      console.log(" Meta Delete Response:", response.data);

      // Remove from local cache if it exists
      this.localTemplates = this.localTemplates.filter(t => t.name !== name);

      return {
        success: true,
        message: "Template deleted successfully",
      };

    } catch (error: any) {
      console.log(" DELETE ERROR:", error.response?.data);
      return {
        success: false,
        message: error.response?.data || "Failed to delete template",
      };
    }
  }

  async updateTemplate(templateId: string, data: any) {
    try {
      console.log(`📝 Updating template ID: ${templateId}`);
      console.log(" UPDATE DATA:", JSON.stringify(data, null, 2));

      const url = `https://graph.facebook.com/v19.0/${templateId}`;

      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      console.log(" Meta Update Response:", response.data);

      // Update local status to PENDING
      const existing = this.localTemplates.find(t => t.id === templateId);
      if (existing) {
        existing.status = "PENDING";
      }

      return {
        success: true,
        message: "Template updated and sent for re-approval",
      };

    } catch (error: any) {
      console.log(" UPDATE ERROR:", error.response?.data);
      return {
        success: false,
        message: error.response?.data || "Failed to update template at Meta",
      };
    }
  }
}