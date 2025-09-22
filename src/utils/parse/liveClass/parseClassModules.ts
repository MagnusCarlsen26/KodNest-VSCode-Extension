import { ClassModule } from "../../../types";

export async function parseClassModules(response: any): Promise<ClassModule[]> {

    const data = (await response.json()).data;
    
    if (!data || data.length === 0) {
        throw new Error('No class modules found');
    }

    return data.map((item: any) => ({
        classModuleId: item.module_id,
        classModuleName: item.module_name,
    }));

}