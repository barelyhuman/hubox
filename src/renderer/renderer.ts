const testButton = document.getElementById('testButton');
const output = document.getElementById('output');

testButton?.addEventListener('click', async () => {
  try {
    // Use the secure API exposed via contextBridge
    const result = await window.electronAPI.invoke({
      action: 'test',
      timestamp: Date.now()
    });
    
    if (output) {
      output.textContent = JSON.stringify(result, null, 2);
    }
  } catch (error) {
    console.error('IPC error:', error);
    if (output) {
      output.textContent = `Error: ${error}`;
    }
  }
});

// Example: Listen for messages from main process
window.electronAPI.on('response1', (data) => {
  console.log('Received from main:', data);
});
