"use client"

import React, { useEffect, useState, useRef } from "react"
import Vapi from "@vapi-ai/web"

interface VoiceAgentWidgetProps {
  apiKey?: string;
  apikey?: string;
}

function lerpColor(a: string, b: string, t: number) {
  function hexToRgb(hex: string) {
    if (hex.startsWith('#')) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
      const num = parseInt(hex, 16);
      return [num >> 16, (num >> 8) & 255, num & 255];
    } else if (hex.startsWith('rgb')) {
      return hex.match(/\d+/g)!.map(Number);
    }
    return [255,255,255];
  }
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  return `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * t)},${Math.round(c1[1] + (c2[1] - c1[1]) * t)},${Math.round(c1[2] + (c2[2] - c1[2]) * t)})`;
}

function CircularWaveform({ amplitude, onClick, style, isMobile, forceDesktopSize, size: customSize }: { amplitude: number, onClick?: () => void, style?: React.CSSProperties, isMobile?: boolean, forceDesktopSize?: boolean, size?: number }) {
  const numPills = 24;
  const useDesktop = forceDesktopSize || !isMobile;
  const isLarge = customSize && customSize >= 64;
  const isChatSmall = customSize === 64;
  const radius = isChatSmall ? 24 : isLarge ? 30 : customSize ? 16 : useDesktop ? 28 : 22;
  const pillWidth = isChatSmall ? 3.2 : isLarge ? 4.5 : customSize ? 2.5 : useDesktop ? 3.5 : 3;
  const minHeight = isChatSmall ? 7 : isLarge ? 10 : customSize ? 6 : useDesktop ? 8 : 7;
  const maxHeight = isChatSmall ? 16 : isLarge ? 26 : customSize ? 14 : useDesktop ? 22 : 16;
  const maxReach = radius + maxHeight / 2;
  const center = maxReach;
  const size = customSize ? customSize : center * 2;
  const [time, setTime] = useState(Date.now());
  const [colorFade, setColorFade] = useState(0);
  const [fadeDirection, setFadeDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    let start: number | null = null;
    let frame: number;
    const lastFade = colorFade;
    function animate(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const duration = 1500; 
      const progress = Math.min(1, elapsed / duration);
      let newFade = fadeDirection === 1
        ? lastFade + progress * (1 - lastFade)
        : lastFade - progress * lastFade;
      newFade = Math.max(0, Math.min(1, newFade));
      setColorFade(newFade);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        if (fadeDirection === 1) {
          setIsPaused(true);
          setTimeout(() => {
            setFadeDirection(-1);
            setIsPaused(false);
          }, 1200);
        } else {
          setIsPaused(true);
          setTimeout(() => {
            setFadeDirection(1);
            setIsPaused(false);
          }, 1200);
        }
      }
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [fadeDirection, isPaused]);

  const waveSpeed = 2 * Math.PI / 2.5;
  const waveCount = 3;
  const effectiveAmplitude = amplitude;

  const colors = [
    'rgb(244,244,245)',   
    'rgb(77,202,250)',  
    'rgb(244,244,245)',  
    'rgb(187,245,41)',   
    'rgb(244,244,245)',
    'rgb(233,107,52)',    
    'rgb(244,244,245)',  
    'rgb(222,148,226)',   
    'rgb(244,244,245)',   
    'rgb(98,246,181)',    
    'rgb(244,244,245)',   
    'rgb(153,119,255)',  
    'rgb(244,244,245)', 
    'rgb(255,221,3)',     
  ];

  return (
    <svg width={size} height={size} style={{ display: 'block', ...style }} onClick={onClick}>
      {[...Array(numPills)].map((_, i) => {
        const angle = (i / numPills) * 2 * Math.PI;
        const t = (time / 1000) * waveSpeed;
        const wave = Math.sin(waveCount * angle - t);
        const animatedHeight = minHeight + (maxHeight - minHeight) * ((wave * effectiveAmplitude + 1) / 2);
        const color = lerpColor('rgb(255,255,255)', colors[i % colors.length], colorFade);
        const radialOffset = radius - animatedHeight / 2;
        return (
          <rect
            key={i}
            x={0}
            y={-pillWidth / 2}
            width={animatedHeight}
            height={pillWidth}
            rx={pillWidth / 2}
            fill={color}
            opacity={0.85}
            transform={`translate(${center},${center}) rotate(${(i / numPills) * 360}) translate(${radialOffset},0)`}
          />
        );
      })}
      <g transform={`translate(${center - 5}, ${center - 9})`}>
        <svg width="10" height="18" viewBox="0 0 82.05 122.88" x="0" y="0" xmlns="http://www.w3.org/2000/svg">
          <path d="M59.89,20.83V52.3c0,27-37.73,27-37.73,0V20.83c0-27.77,37.73-27.77,37.73,0Zm-14.18,76V118.2a4.69,4.69,0,0,1-9.37,0V96.78a40.71,40.71,0,0,1-12.45-3.51A41.63,41.63,0,0,1,12.05,85L12,84.91A41.31,41.31,0,0,1,3.12,71.68,40.73,40.73,0,0,1,0,56a4.67,4.67,0,0,1,8-3.31l.1.1A4.68,4.68,0,0,1,9.37,56a31.27,31.27,0,0,0,2.4,12.06A32,32,0,0,0,29,85.28a31.41,31.41,0,0,0,24.13,0,31.89,31.89,0,0,0,10.29-6.9l.08-.07a32,32,0,0,0,6.82-10.22A31.27,31.27,0,0,0,72.68,56a4.69,4.69,0,0,1,9.37,0,40.65,40.65,0,0,1-3.12,15.65A41.45,41.45,0,0,1,70,85l-.09.08a41.34,41.34,0,0,1-11.75,8.18,40.86,40.86,0,0,1-12.46,3.51Z" fill="#fff"/>
        </svg>
      </g>
    </svg>
  );
}

export default function VoiceAgentWidget({ apiKey, apikey }: VoiceAgentWidgetProps) {
  const effectiveApiKey = apiKey || apikey;
  const [vapi, setVapi] = useState<InstanceType<typeof Vapi> | null>(null)
  const [status, setStatus] = useState("Ready")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [isApiKeyValid, setIsApiKeyValid] = useState(true)
  const numPills = 24;
  const minHeight = 8;
  const maxHeight = 22;
  const radius = 28;
  const maxReach = radius + maxHeight / 2;
  const size = maxReach * 2;
  const [waveform, setWaveform] = useState(Array(numPills).fill(0));
  const waveformRef = useRef(waveform);
  waveformRef.current = waveform;
  const [dotCount, setDotCount] = useState(0);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [showFullWidget, setShowFullWidget] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [transcript, setTranscript] = useState<{
    role: 'assistant' | 'user';
    text: string;
    isPartial?: boolean;
    finalTextLength?: number;
  }[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 600);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) setShowFullWidget(true);
    else setShowFullWidget(false);
  }, [isMobile]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isConnecting) {
      interval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 400);
    } else {
      setDotCount(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnecting]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@vapi-ai/web").then((module) => {
        const Vapi = module.default

        if (!effectiveApiKey) {
          setErrorMessage("API key is missing. Please check your environment variables.")
          setStatus("Error")
          setIsApiKeyValid(false)
          return
        }
        const vapiInstance = new Vapi(effectiveApiKey)
        setVapi(vapiInstance)
        setIsApiKeyValid(true)

        vapiInstance.on("call-start", () => {
          setIsConnecting(false)
          setIsConnected(true)
          setErrorMessage("")
          setStatus("Connected")
        })

        vapiInstance.on("call-end", () => {
          setIsConnecting(false)
          setIsConnected(false)
          setStatus("Call ended")
        })

        vapiInstance.on("speech-start", () => {
          setIsSpeaking(true)
        })

        vapiInstance.on("speech-end", () => {
          setIsSpeaking(false)
        })

        vapiInstance.on("volume-level", (level: number) => {
          setVolumeLevel(level)
          setWaveform(prev => {
            const next = [...prev.slice(1), level];
            waveformRef.current = next;
            return next;
          });
        })

        vapiInstance.on("error", (error: any) => {
          setIsConnecting(false)

          if (error?.error?.message?.includes("card details")) {
            setErrorMessage("Payment required. Visit the Vapi dashboard to set up your payment method.")
          } else if (error?.error?.statusCode === 401 || error?.error?.statusCode === 403) {
            setErrorMessage("API key is invalid. Please check your environment variables.")
            setIsApiKeyValid(false)
          } else {
            setErrorMessage(error?.error?.message || "An error occurred")
          }

          setStatus("Error")
        })

        vapiInstance.on("message", (msg: any) => {
          if (msg.type === "function_call" && msg.name === "navigate_docs" && msg.parameters?.page) {
            window.location.assign(msg.parameters.page);
          }
          if (msg.type === 'transcript') {
            setTranscript((prev) => {
              if (prev.length > 0 && prev[prev.length - 1].role === msg.role) {
                const lastMessage = prev[prev.length - 1];
                let newText;
                let newFinalTextLength;
                
                if (msg.transcriptType === 'partial') {
                  const finalizedText = lastMessage.text.substring(0, lastMessage.finalTextLength || 0);
                  newText = finalizedText + (finalizedText ? ' ' : '') + msg.transcript;
                  newFinalTextLength = lastMessage.finalTextLength || 0;
                } else {
                  const finalizedText = lastMessage.text.substring(0, lastMessage.finalTextLength || 0);
                  newText = finalizedText + (finalizedText ? ' ' : '') + msg.transcript;
                  newFinalTextLength = newText.length;
                }
                
                return [
                  ...prev.slice(0, -1),
                  { 
                    role: msg.role, 
                    text: newText,
                    isPartial: msg.transcriptType === 'partial',
                    finalTextLength: newFinalTextLength
                  }
                ];
              } else {
                return [
                  ...prev,
                  { 
                    role: msg.role, 
                    text: msg.transcript,
                    isPartial: msg.transcriptType === 'partial',
                    finalTextLength: msg.transcriptType === 'final' ? msg.transcript.length : 0
                  }
                ];
              }
            });
          }
        });

        console.log('[VoiceAgentWidget] Vapi event handlers registered');
      })
    }

    return () => {
      if (vapi) {
        vapi.stop()
      }
    }
  }, [apiKey, apikey])

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  const ASSISTANT_ID = "97290a92-6ffa-40cf-8b0d-676655c73b02";

  const startCall = () => {
    if (!isApiKeyValid) {
      setErrorMessage("Cannot start call: API key is invalid or missing.");
      return;
    }
    setShowChat(true);
    setIsConnecting(true);
    setStatus("Connecting...");
    setErrorMessage("");
    if (vapi) {
      vapi.start(ASSISTANT_ID);
    }
  };

  const endCallAndClose = () => {
    if (vapi) vapi.stop();
    setShowChat(false);
    setIsConnected(false);
    setStatus("Ready");
    setTranscript([]);
  };

  if (!showChat) {
    return (
      <div
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 1000,
          background: '#000',
          borderRadius: '20px',
          boxShadow: '0 4px 16px 0 rgba(0,0,0,0.28)',
          display: 'flex',
          alignItems: 'center',
          minWidth: 260,
          maxWidth: 320,
          minHeight: 100,
          padding: '0 12px 0 0',
        }}
      >
        <div style={{
          width: 88,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 4,
          marginRight: 8,
        }}>
          <CircularWaveform amplitude={0.5} isMobile={false} />
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
          alignItems: 'flex-start',
          gap: 1,
        }}>
          <div style={{
            fontWeight: 600,
            fontSize: 15,
            color: '#fff',
            marginBottom: 0,
          }}>Need support?</div>
          <button
            onClick={startCall}
            disabled={isConnecting || !isApiKeyValid}
            className={`voice-agent-btn${isConnecting || !isApiKeyValid ? ' disabled' : ''}`}
            style={{
              background: '#fff',
              color: '#181818',
              border: '1.5px solid transparent',
              borderRadius: 999,
              width: 'auto',
              height: 'auto',
              padding: '6px 22px',
              fontSize: 13,
              fontFamily: "Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontWeight: 500,
              letterSpacing: '1px',
              cursor: isConnecting || !isApiKeyValid ? 'not-allowed' : 'pointer',
              marginBottom: 12,
              boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
              transition: 'background 0.2s, color 0.2s, border 0.2s',
              textAlign: 'center',
              opacity: isConnecting || !isApiKeyValid ? 0.7 : 1,
              maxWidth: '100%',
              marginTop: 8,
            }}
          >
            Start voice chat
          </button>
          <style>{`
            .voice-agent-btn:hover:not(.disabled) {
              background: #000 !important;
              color: #fff !important;
              border: 1.5px solid #fff !important;
            }
            .voice-agent-btn.disabled {
              cursor: not-allowed;
              opacity: 0.7;
            }
          `}</style>
        </div>
      </div>
    );
  }

  console.log('[VoiceAgentWidget] Rendering full widget, status:', status, 'error:', errorMessage);
  return (
    <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000, width: 480, maxWidth: '95vw', background: '#000', borderRadius: 12, boxShadow: '0 12px 48px 0 rgba(0,0,0,0.55)', padding: 0, display: 'flex', flexDirection: 'column', minHeight: 500, maxHeight: '90vh', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px 0px 24px', minHeight: 72, background: '#000', fontFamily: 'Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: -8 }}>
          <div style={{ width: 64, height: 64}}>
            <CircularWaveform amplitude={isConnected || isSpeaking ? volumeLevel : 0.5} isMobile={false} size={64} />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, background: '#000', borderRadius: '0 0 16px 16px', padding: 20, overflowY: 'auto', color: '#fff', fontSize: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {transcript.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                background: msg.role === 'user' ? '#12A594' : '#222',
                color: msg.role === 'user' ? '#fff' : '#fff',
                borderRadius: '18px',
                padding: '10px 16px',
                fontSize: 15,
                marginLeft: msg.role === 'user' ? 24 : 0,
                marginRight: msg.role === 'user' ? 0 : 24,
                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                wordBreak: 'break-word',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={transcriptEndRef} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #222', background: '#000' }}>
        <button
          onClick={endCallAndClose}
          disabled={isConnecting || !isApiKeyValid}
          className={`voice-agent-btn hangup-btn${isConnecting || !isApiKeyValid ? ' disabled' : ''}`}
          style={{
            fontSize: 16,
            padding: 0,
            borderRadius: 8,
            background: '#000',
            color: '#fff',
            border: '0.5px solid #fff',
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s, color 0.2s',
            cursor: isConnecting || !isApiKeyValid ? 'not-allowed' : 'pointer',
          }}
          title="Hang up"
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M29.209 14.391c-3.383-3.375-8.052-5.462-13.208-5.462s-9.825 2.087-13.208 5.462l0-0c-0.941 0.952-1.522 2.261-1.522 3.706 0 1.443 0.58 2.751 1.519 3.703l-0.001-0.001 0.002 0.002c0.204 0.21 0.428 0.398 0.671 0.561l0.015 0.009c0.408 0.299 0.886 0.532 1.402 0.673l0.030 0.007c0.054 0.013 0.116 0.021 0.18 0.021h0c0 0 0.001 0 0.001 0 0.165 0 0.318-0.053 0.441-0.144l-0.002 0.001 5.891-4.277c0.188-0.138 0.309-0.359 0.31-0.607v-0c-0.002-0.797-0.187-1.551-0.515-2.221l0.013 0.030c1.41-0.598 3.050-0.945 4.771-0.945s3.361 0.347 4.854 0.976l-0.082-0.031c-0.316 0.641-0.501 1.394-0.502 2.191v0c0 0.248 0.121 0.469 0.307 0.606l0.002 0.001 5.891 4.277c0.125 0.088 0.28 0.14 0.448 0.14 0.061 0 0.121-0.007 0.179-0.020l-0.005 0.001c0.833-0.248 1.546-0.681 2.121-1.252l-0 0c0.939-0.952 1.519-2.26 1.519-3.703s-0.581-2.753-1.521-3.706l0.001 0.001zM28.146 20.74c-0.147 0.151-0.308 0.285-0.483 0.401l-0.011 0.007c-0.177 0.129-0.378 0.243-0.591 0.334l-0.020 0.008-5.252-3.813c0.076-0.658 0.313-1.249 0.672-1.747l-0.008 0.011c0.086-0.12 0.137-0.27 0.137-0.432 0-0.295-0.17-0.55-0.418-0.672l-0.004-0.002c-1.8-0.901-3.922-1.428-6.167-1.428s-4.367 0.527-6.249 1.465l0.081-0.037c-0.252 0.125-0.421 0.38-0.421 0.675 0 0.161 0.051 0.31 0.137 0.432l-0.002-0.002c0.35 0.488 0.588 1.079 0.662 1.72l0.002 0.017-5.252 3.813c-0.247-0.107-0.46-0.229-0.657-0.372l0.010 0.007c-0.171-0.115-0.32-0.241-0.454-0.38l-0.001-0.001c-0.672-0.68-1.088-1.616-1.088-2.648 0-1.031 0.414-1.965 1.085-2.645l-0 0c3.111-3.104 7.404-5.023 12.146-5.023s9.036 1.919 12.147 5.023l-0-0c0.671 0.68 1.085 1.614 1.085 2.645s-0.414 1.965-1.085 2.645l0-0z"/>
          </svg>
        </button>
        <style>{`
          .hangup-btn:not(.disabled):hover {
            background: #e5e7eb !important;
            color: #181818 !important;
            border: 0.5px solid #e5e7eb !important;
          }
        `}</style>
      </div>
    </div>
  )
} 