import { ClassTopic } from "../../../types";

export async function parseClassTopics(
    response: any
): Promise<ClassTopic[]> {

    const data = (await response.json()).data;

    if (!data || data.length === 0) {
        throw new Error('No class topics found');
    }

    return data.map((item: any) => ({
        classTopicId: item.topic_id,
        classTopicName: item.topic_name,
    }));
}