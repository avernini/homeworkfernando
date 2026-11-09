import { google } from 'googleapis';
import { Readable } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioData, fileName } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Configuração de Autenticação com o Google Drive via Variáveis de Ambiente na Vercel
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Converte o base64 do áudio gravado no navegador para um Stream legível pelo Google Drive
    const buffer = Buffer.from(audioData.split(',')[1], 'base64');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const folderId = '1_bdkNafmrB0yXVp4Lx6q570v9NrgHxaE'; // ID da sua pasta do Google Drive

    const fileMetadata = {
      name: fileName || `TOEFL_Speaking_${Date.now()}.webm`,
      parents: [folderId],
    };

    const media = {
      mimeType: 'audio/webm',
      body: stream,
    };

    // Executa o upload oficial para a sua pasta
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name',
    });

    return res.status(200).json({ 
      success: true, 
      fileId: response.data.id,
      message: 'Audio uploaded successfully to Google Drive!' 
    });

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return res.status(500).json({ error: 'Internal Server Error during Drive upload' });
  }
}