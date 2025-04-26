declare module '../../../utils/projectServiceAdapter' {
    export function convertToUIProject(apiProject: any): any;
    export function convertStatusToUI(status: string): string;
    export function getUserAvatar(name: string | null): string;
    export function getCategoryColor(category: string): string;
    export function formatDate(dateString: string | null): string;
    export function convertStatusToAPI(status: string): string;
    export function convertToAPIProject(uiProject: any): any;
  }