// HTTPS backend - clean deploy v5
const API_BASE = 'https://audioroad-webrtc-system.onrender.com';

const EnhancedHostDashboard = () => {
  const [callerQueue, setCallerQueue] = useState([]);
  const [activeCallers, setActiveCallers] = useState([]);
  const [audioChannels, setAudioChannels] = useState({});
  const [masterVolume, setMasterVolume] = useState(85);
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastSync, setLastSync] = useState('');

  const channelSetup = [
    { id: 'host', label: 'Host Mic', type: 'host' },
    { id: 'guest1', label: 'Guest 1', type: 'guest' },
    { id: 'guest2', label: 'Guest 2', type: 'guest' },
    { id: 'caller1', label: 'Caller 1', type: 'caller' },
    { id: 'caller2', label: 'Caller 2', type: 'caller' },
    { id: 'caller3', label: 'Caller 3', type: 'caller' },
    { id: 'caller4', label: 'Caller 4', type: 'caller' },
    { id: 'caller5', label: 'Caller 5', type: 'caller' },
    { id: 'computer', label: 'Computer Audio', type: 'computer' }
  ];

  const audioLibrary = [
    { id: 1, name: 'Show Open - Trucking Business & Beyond', type: 'open', duration: '0:45' },
    { id: 2, name: 'Show Close - Thank You', type: 'close', duration: '0:30' },
    { id: 3, name: 'Commercial Break Intro', type: 'transition', duration: '0:15' },
    { id: 4, name: 'Sponsor - AudioRoad', type: 'commercial', duration: '1:00' }
  ];

  useEffect(() => {
    // Initialize audio channels
    const initialChannels = {};
    channelSetup.forEach(channel => {
      initialChannels[channel.id] = {
        volume: channel.id === 'host' ? 85 : 65,
        muted: false,
        connected: channel.id === 'host',
        currentLevel: 0
      };
    });
    setAudioChannels(initialChannels);

    // Fetch callers from API
    fetchCallers();
    
    // Set up polling
    const interval = setInterval(fetchCallers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchCallers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/callers`);
      if (response.ok) {
        const callers = await response.json();
        setCallerQueue(callers);
        setConnectionStatus('connected');
        setLastSync(new Date().toLocaleTimeString());
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Failed to fetch callers:', error);
      setConnectionStatus('error');
    }
  };

  const takeCallerLive = (caller) => {
    const availableChannel = channelSetup.find(ch => 
      ch.type === 'caller' && !audioChannels[ch.id].connected
    );
    
    if (availableChannel) {
      setAudioChannels(prev => ({
        ...prev,
        [availableChannel.id]: { ...prev[availableChannel.id], connected: true }
      }));
      
      setActiveCallers(prev => [...prev, {
        ...caller,
        channelId: availableChannel.id,
        liveTime: new Date()
      }]);
      
      setCallerQueue(prev => prev.filter(c => c.id !== caller.id));
    }
  };

  const endCall = (callerId) => {
    const line = activeCallers.find(l => l.id === callerId);
    if (line) {
      setAudioChannels(prev => ({
        ...prev,
        [line.channelId]: { ...prev[line.channelId], connected: false }
      }));
      setActiveCallers(prev => prev.filter(l => l.id !== callerId));
    }
  };

  const updateChannelVolume = (channelId, volume) => {
    setAudioChannels(prev => ({
      ...prev,
      [channelId]: { ...prev[channelId], volume: parseInt(volume) }
    }));
  };

  const toggleChannelMute = (channelId) => {
    setAudioChannels(prev => ({
      ...prev,
      [channelId]: { ...prev[channelId], muted: !prev[channelId].muted }
    }));
  };

  const playAudioClip = (clip) => {
    console.log(`Playing: ${clip.name}`);
  };

  const AudioChannel = ({ channel }) => {
    const channelData = audioChannels[channel.id];
    if (!channelData) return null;

    const isActive = channelData.connected;
    const level = channelData.currentLevel || (isActive ? Math.random() * 80 + 10 : 0);

    return (
      <div style={{
        padding: '12px',
        border: isActive ? '2px solid #10b981' : '1px solid #d1d5db',
        borderRadius: '8px',
        backgroundColor: isActive ? '#f0fdf4' : '#f9fafb',
        minHeight: '200px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{channel.label}</span>
          {isActive && (
            <span style={{
              padding: '2px 6px',
              backgroundColor: '#10b981',
              color: 'white',
              borderRadius: '4px',
              fontSize: '10px'
            }}>LIVE</span>
          )}
        </div>
        
        {isActive ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Audio Level */}
            <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${level}%`,
                backgroundColor: level > 80 ? '#ef4444' : level > 60 ? '#f59e0b' : '#10b981',
                transition: 'all 0.2s'
              }} />
            </div>
            
            {/* Volume Control */}
            <div>
              <label style={{ fontSize: '12px' }}>Volume</label>
              <input
                type="range"
                min="0"
                max="150"
                value={channelData.volume}
                onChange={(e) => updateChannelVolume(channel.id, e.target.value)}
                style={{ width: '100%' }}
              />
              <div style={{ textAlign: 'center', fontSize: '12px' }}>{channelData.volume}%</div>
            </div>
            
            {/* Controls */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => toggleChannelMute(channel.id)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: channelData.muted ? '#ef4444' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {channelData.muted ? '🔇' : '🔊'}
              </button>
              
              {channel.type === 'caller' && (
                <button
                  onClick={() => {
                    const activeLine = activeCallers.find(l => l.channelId === channel.id);
                    if (activeLine) endCall(activeLine.id);
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  📞❌
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '120px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎙️</div>
            <p style={{ fontSize: '12px' }}>Not Connected</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#1f2937',
      color: 'white',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📻 Enhanced Host Dashboard
          </h1>
          <p style={{ margin: 0, color: '#d1d5db' }}>Professional Broadcast Control System</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: isLive ? '#dc2626' : '#374151'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isLive ? 'white' : '#6b7280',
              animation: isLive ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{ fontWeight: '500' }}>{isLive ? 'ON AIR' : 'OFF AIR'}</span>
          </div>
          
          <button
            onClick={() => setIsLive(!isLive)}
            style={{
              padding: '8px 16px',
              backgroundColor: isLive ? '#dc2626' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            📻 {isLive ? 'Go Off Air' : 'Go Live'}
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px'
      }}>
        {/* Left Column - Audio Mixer */}
        <div style={{
          backgroundColor: '#374151',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎚️ 10-Channel Audio Mixer
          </h2>
          
          {/* Master Volume */}
          <div style={{
            padding: '16px',
            backgroundColor: '#4b5563',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '14px' }}>Master Volume:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume}
                onChange={(e) => setMasterVolume(e.target.value)}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '14px', width: '48px' }}>{masterVolume}%</span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsRecording(!isRecording)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isRecording ? '#dc2626' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {isRecording ? '⏹️ Stop Recording' : '▶️ Start Recording'}
              </button>
            </div>
          </div>

          {/* Audio Channels Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {channelSetup.map(channel => (
              <AudioChannel key={channel.id} channel={channel} />
            ))}
          </div>
        </div>

        {/* Right Column - Controls & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Ready Callers */}
          <div style={{
            backgroundColor: '#374151',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                Ready Callers ({callerQueue.length})
              </h3>
              <button
                onClick={fetchCallers}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>
            
            {callerQueue.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📞</div>
                <p style={{ margin: '0 0 8px 0' }}>No callers ready</p>
                <p style={{ margin: 0, fontSize: '12px' }}>
                  Waiting for screener to send callers
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {callerQueue.map(caller => (
                  <div key={caller.id} style={{
                    padding: '12px',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    backgroundColor: '#4b5563'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontWeight: '600' }}>{caller.name}</h4>
                        <p style={{ margin: '0', fontSize: '12px', color: '#d1d5db' }}>
                          {caller.phone} • {caller.location}
                        </p>
                      </div>
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '10px'
                      }}>
                        HIGH
                      </span>
                    </div>
                    
                    <p style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {caller.topic}
                    </p>
                    
                    <p style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: '12px',
                      color: '#d1d5db'
                    }}>
                      {caller.notes}
                    </p>
                    
                    <button
                      onClick={() => takeCallerLive(caller)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      📞 Take Live
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Show Audio */}
          <div style={{
            backgroundColor: '#374151',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🎵 Show Audio
            </h3>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {audioLibrary.map(clip => (
                <div key={clip.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  backgroundColor: '#4b5563',
                  borderRadius: '4px',
                  marginBottom: '4px'
                }}>
                  <div>
                    <p style={{ margin: '0', fontSize: '12px', fontWeight: '500' }}>{clip.name}</p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        padding: '1px 4px',
                        backgroundColor: '#6b7280',
                        borderRadius: '2px',
                        fontSize: '10px'
                      }}>
                        {clip.type}
                      </span>
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>{clip.duration}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => playAudioClip(clip)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    ▶️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div style={{
            backgroundColor: '#374151',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ✅ System Status
            </h3>
            
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>WebRTC:</span>
                <span style={{ color: connectionStatus === 'connected' ? '#10b981' : '#ef4444' }}>
                  {connectionStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Show Status:</span>
                <span style={{ color: isLive ? '#ef4444' : '#6b7280' }}>
                  {isLive ? 'LIVE' : 'Off Air'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Recording:</span>
                <span style={{ color: isRecording ? '#ef4444' : '#6b7280' }}>
                  {isRecording ? 'Recording' : 'Stopped'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Last Sync:</span>
                <span>{lastSync || 'Never'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Active Calls:</span>
                <span>{activeCallers.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedHostDashboard;
