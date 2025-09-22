import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { GITHUB_DB_URL, DB_FILE_NAME } from '../../constants/db.link';

export async function downloadDb(
    context: vscode.ExtensionContext
): Promise<void> {

    const dbDirectory = path.join(context.extensionPath, 'database');
    const dbFilePath = path.join(dbDirectory, DB_FILE_NAME);
  
    if (fs.existsSync(dbFilePath)) {
      console.log('Database file already exists. Skipping download.');
      return;
    }
  
    vscode.window.showInformationMessage('Downloading KodNest problem database...');
  
    if (!fs.existsSync(dbDirectory)) {
      fs.mkdirSync(dbDirectory, { recursive: true });
    }
  
    try {

      const response = await downloadDbFromGithub();
      fs.writeFileSync(dbFilePath, response);

      vscode.window.showInformationMessage('KodNest problem database downloaded successfully!');
    
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to download KodNest problem database: ${error.message}`);
      console.error('Error downloading database:', error);
    }
}

async function downloadDbFromGithub(
): Promise<string> {

    return await new Promise<string>((resolve, reject) => {
        https.get(GITHUB_DB_URL, (res) => {

          if (res.statusCode !== 200) {
            reject(new Error(`Failed to download database: HTTP Status Code ${res.statusCode}`));
            return;
          }

          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
          res.on('error', (err) => reject(err));

        }).on('error', (err) => reject(err));

    });
}