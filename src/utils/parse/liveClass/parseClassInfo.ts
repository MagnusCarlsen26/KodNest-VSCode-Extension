import { ClassInfo } from '../../../types';

export async function parseClassInfo(
    response: any
): Promise<ClassInfo[]> {
    
    const data = (await response.json()).data;

    if (!data || data.length === 0) {
        throw new Error('No class info found');
    }

    return data.map((item: any) => ({
        courseId: item.course_id,
        courseName: item.course_name,
        controlType: item.control_type,
        totalSessions: item.total_sessions,
        totalPresent: item.total_present,
        totalAbsent: item.total_absent,
        attendancePercentage: item.attendance_percentage,
    }));
}