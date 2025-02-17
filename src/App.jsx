import { RealtimeClient, RealtimeUtils,EventNames } from "@coze/realtime-api";
import { useEffect, useState } from "react";

function App() {
  const [accessToken, setAccessToken] = useState('');
  const [botId, setBotId] = useState('');
  const [perm, setPerm] = useState(false);
  const [client, setClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (!isConfigured) return;
    // 检查设备权限
    RealtimeUtils.checkDevicePermission().then((result) => {
      // 检查麦克风权限
      setPerm(result.audio);
      if (result.audio) {
        if (!accessToken || !botId || !perm) return;
        // 初始化实时客户端
        const client = new RealtimeClient({
          accessToken,
          botId,
          connectorId: '1024',
          allowPersonalAccessTokenInBrowser: true,  // 可选：允许在浏览器中使用个人访问令牌
        });
        // 监听所有事件
        client.on(EventNames.ALL, (eventName, data) => {
            console.log(eventName, data);
            if (eventName === "server.conversation.message.completed") {
              if (data.data.type == "answer" || data.data.type == "question") {
                setMessages(prev => {
                  if (data.data.content_type == "text") {
                    const newMessages = [...prev, data.data.content];
                    return newMessages.slice(-10); // 只保留最新的10条消息
                  } else {
                    return [...prev]
                  }
                });
              } else {
                setMessages(prev => {
                  const newMessages = [...prev, `【${data.data.type}...】`];
                  return newMessages.slice(-10); // 只保留最新的10条消息
                });
              }
            }
            if (eventName === 'server.conversation.created') {
              setMessages(prev => {
                const newMessages = [...prev, data.data.prologue];
                return newMessages.slice(-10); // 只保留最新的10条消息
              });
            }
        });
        setClient(client);
      }
    });
  }, [isConfigured, accessToken, botId, perm]);

  useEffect(() => {
    if (client) {
      // 启动实时客户端
      client.connect();
      setConnected(true);
    }
    return () => {
      if (client) {
        // 停止实时客户端
        client.disconnect();
      }
    }
  }, [client]);

  if (!isConfigured) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Access Token:</label>
            <input
              type="text"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #d9d9d9'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Bot ID:</label>
            <input
              type="text"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #d9d9d9'
              }}
            />
          </div>
          <button
            onClick={() => setIsConfigured(true)}
            disabled={!accessToken || !botId}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '5px',
              border: 'none',
              cursor: !accessToken || !botId ? 'not-allowed' : 'pointer',
              backgroundColor: !accessToken || !botId ? '#d9d9d9' : '#52c41a',
              color: 'white',
              transition: 'all 0.3s'
            }}
          >
            确认
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!perm ? <h1 style={{color:'red'}}> 请开启audio权限 </h1> : (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            height: '1000px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            overflowY: 'auto',
            border: '1px solid #e8e8e8'
          }}>
            {messages.map((message, index) => (
              <div key={index} style={{
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px',
                marginBottom: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {message}
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              const newState = !connected;
              if (newState) {
                client?.connect();
              } else {
                client?.disconnect();
              }
              setConnected(newState);
            }}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: connected ? '#ff4d4f' : '#52c41a',
              color: 'white',
              transition: 'all 0.3s'
            }}
          >
            {connected ? '退出对话' : '重新加入对话'}
          </button>
          <h1>{connected ? '正在使用你的麦克风' : ''}</h1>
        </div>
      )}
    </div>
  );
}

export default App
