import { ClassSubtopic } from "../../../types";


export async function parseClassSubTopics(
    response: any
): Promise<ClassSubtopic[]> {

    const data = (await response.json()).data.student_subtopics;

    if (!data || data.length === 0) {
        throw new Error('No class sub topics found');
    }

    return data.map((item: any) => ({
            is_last: item.is_last,
            is_submittable: item.is_submittable,
            layout_id: item.layout_id,
            name: item.name,
            priority: item.priority,
            process_id: item.process_id,
            required: item.required,
            role: item.role,
            status: item.status,
            submitted: item.submitted,
            subtopic_id: item.subtopic_id,
            template_id: item.template_id,
            type: item.type,
            user_id: item.user_id,
            workflow_id: item.workflow_id
        }
    ));
}
