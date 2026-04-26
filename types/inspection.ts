export type InspectionTool = 'MANUAL' | 'AIHUISHOU' | 'SHANJIAN' | 'WEIXUE' | 'OTHER';

export interface InspectionFormState {
  deviceId: string;
  inspectionTool: InspectionTool;
  overallScore: string;
  overallGrade: string;
  screenCheck: string;
  batteryCheck: string;
  boardCheck: string;
  cameraCheck: string;
  sensorCheck: string;
  networkCheck: string;
  exteriorCheck: string;
  issues: string[];
}
