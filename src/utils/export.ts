import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { loadState } from './storage';

export const exportData = async (): Promise<void> => {
  // Check and request storage permissions
  const permissionStatus = await Filesystem.checkPermissions();
  
  if (permissionStatus.publicStorage !== 'granted') {
    const requestResult = await Filesystem.requestPermissions();
    
    if (requestResult.publicStorage !== 'granted') {
      throw new Error('Storage permission denied');
    }
  }
  try {
    const data = loadState();
    if (!data) {
      throw new Error('No data available to export');
    }

    const jsonData = JSON.stringify(data, null, 2);
    const fileName = `export-${new Date().toISOString().slice(0,10)}.json`;

    await Filesystem.writeFile({
      path: `Documents/${fileName}`,
      data: jsonData,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });

    console.log('Data exported successfully:', fileName);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};
