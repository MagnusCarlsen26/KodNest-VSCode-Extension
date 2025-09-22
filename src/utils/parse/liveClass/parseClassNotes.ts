import { ClassNotes } from "../../../types";

export async function parseNotes(
    response: any
): Promise<ClassNotes> {

    const data = (await response.json()).data.page;

    if (!data || data.length === 0) {
        throw new Error('No class sub topic notes found');
    }

    if ( !data?.content?.text ) {
        throw new Error('This is not notes')
    }

    return {

        notesContent: {
            text: data.content.text,
            assessmentId: data.content.assessment_id,
        },
        isSubmittable: data.is_submittable,
        layoutId: data.layout_id,
        topicName: data.topic_name,
        type: data.type,

    };
}