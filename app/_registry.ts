// 메인 화면에 보여줄 서비스 목록. 서비스를 추가할 때만 여기를 고친다.
import { service as courseplan } from "./course-plan/meta";
import { service as opportunities } from "./opportunities/meta";
import { service as study } from "./study/meta";

export const services = [opportunities, courseplan, study];
