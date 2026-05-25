import { apiFetch } from "../api";


export async function createTemplate(data: any) {
  return apiFetch("/template/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


export async function getTemplates() {
  return apiFetch("/template/all", {
    method: "GET",
  });
}


export async function deleteTemplate(name: string) {
  return apiFetch("/template/delete", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}