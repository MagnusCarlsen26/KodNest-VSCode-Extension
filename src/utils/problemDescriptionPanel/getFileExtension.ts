export function getFileExtension(
    languageName: string
): string {

    switch ( languageName.toLowerCase() ) {

        case 'java (openjdk 13.0.1)': return '.java';
        case 'python': return '.py';
        case 'javascript': return '.js';
        case 'typescript': return '.ts';
        default: return '.txt';

    }

}