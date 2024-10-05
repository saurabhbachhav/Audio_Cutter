// src/components/AudioCutter.tsx

'use client'; // For client-side rendering
import { useState, useEffect, useRef } from 'react';
import { Button, Slider, Text, Title, Container, Group, Stack, Box } from '@mantine/core';
import WaveSurfer from 'wavesurfer.js';
import './AudioCutter.css'; // Import the CSS file

export default function AudioCutter() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [waveSurferInstance, setWaveSurferInstance] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // Track play/pause state
  const [duration, setDuration] = useState<number>(0);
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(100);
  const waveformRef = useRef<HTMLDivElement | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (audioFile && waveformRef.current) {
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#888', // Light gray for waveform
        progressColor: '#9400D3', // Violet for progress
        barWidth: 2,
        height: 150,
      });

      const reader = new FileReader();
      reader.onload = () => {
        wavesurfer.loadBlob(audioFile);
      };
      reader.readAsDataURL(audioFile);

      wavesurfer.on('ready', () => {
        setDuration(wavesurfer.getDuration());
        setEnd(wavesurfer.getDuration());
        wavesurfer.play(); // Automatically play when a new audio file is loaded
        setIsPlaying(true); // Set playing state to true
      });

      wavesurfer.on('finish', () => {
        setIsPlaying(false); // Reset playing state when audio ends
      });

      setWaveSurferInstance(wavesurfer);

      return () => wavesurfer.destroy(); // Cleanup on unmount
    }
  }, [audioFile]);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      if (waveSurferInstance) {
        waveSurferInstance.stop(); // Stop current audio
        setIsPlaying(false); // Set playing state to false
      }
      setAudioFile(files[0]);
      setStart(0); // Reset start point
      setEnd(100); // Reset end point
    }
  };

  // Reset the audio selection and state
  const handleReset = () => {
    if (waveSurferInstance) {
      waveSurferInstance.stop();
      setAudioFile(null);
      setDuration(0);
      setStart(0);
      setEnd(100);
      setIsPlaying(false);
    }
  };

  // Trim the audio and provide a download link
  const handleTrim = () => {
    if (waveSurferInstance && duration > 0) {
      const startTime = (start / 100) * duration;
      const endTime = (end / 100) * duration;

      // Create a new OfflineAudioContext for trimming
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Load the original audio into the buffer
      fetch(URL.createObjectURL(audioFile))
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(buffer => {
          const trimmedBuffer = audioContext.createBuffer(
            buffer.numberOfChannels,
            buffer.sampleRate * (endTime - startTime),
            buffer.sampleRate
          );

          for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            trimmedBuffer.copyToChannel(
              buffer.getChannelData(channel).slice(startTime * buffer.sampleRate, endTime * buffer.sampleRate),
              channel
            );
          }

          // Create a new Blob from the trimmed audio buffer
          const audioBlob = new Blob([trimmedBuffer], { type: 'audio/wav' });
          const downloadUrl = URL.createObjectURL(audioBlob);
          
          // Create a link and simulate a click to download the trimmed audio
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = 'trimmed-audio.wav'; // Change filename as needed
          a.click();

          // Play the trimmed audio
          const newSource = audioContext.createBufferSource();
          newSource.buffer = trimmedBuffer;
          newSource.connect(audioContext.destination);
          newSource.start(0);
        })
        .catch(error => console.error('Error trimming audio:', error));
    }
  };

  return (
    <Container
      size="lg"
      className="container" // Use className for styling
    >
      {/* Left-Side Buttons UI */}
      <Box className="sidebar">
        <Title order={3} className="dashboard-title">Dashboard</Title>
        <Stack spacing="md">
          <Button className="button" onClick={() => document.getElementById('file-upload')?.click()}>
            Upload Another File
          </Button>
          <Button className="button" onClick={handleReset}>
            Reset Selection
          </Button>
          <Button className="button">
            Help
          </Button>
        </Stack>
      </Box>

      {/* Main Section: Audio Showcase and Trimming */}
      <Box style={{ flex: 1 }}>
        <Title align="center" style={{ color: '#fff', marginBottom: '20px' }}>
          Audio Cutter
        </Title>

        {/* Custom Dropzone */}
        <Box className="dropzone">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
            <Text size="lg" style={{ color: '#fff', fontWeight: 'bold' }}>
              Drag and drop your audio file here, or click to select a file
            </Text>
          </label>
        </Box>

        {/* Waveform Visualization */}
        <div
          ref={waveformRef}
          className="waveform"
        ></div>

        {/* Sliders for Start and End Points */}
        {duration > 0 && (
          <>
            <Group grow style={{ marginTop: '20px' }}>
              <div>
                <Text className="slider-label">
                  Start Time: {((start / 100) * duration).toFixed(2)}s
                </Text>
                <Slider
                  value={start}
                  onChange={setStart}
                  min={0}
                  max={end}
                  styles={{
                    track: { backgroundColor: '#666', height: '8px' }, // Lighter gray for track
                    thumb: { backgroundColor: '#9400D3', width: '16px', height: '16px' }, // Violet thumb
                  }}
                />
              </div>
              <div>
                <Text className="slider-label">
                  End Time: {((end / 100) * duration).toFixed(2)}s
                </Text>
                <Slider
                  value={end}
                  onChange={setEnd}
                  min={start}
                  max={100}
                  styles={{
                    track: { backgroundColor: '#666', height: '8px' }, // Lighter gray for track
                    thumb: { backgroundColor: '#9400D3', width: '16px', height: '16px' }, // Violet thumb
                  }}
                />
              </div>
            </Group>

            <Button
              fullWidth
              className="trim-button"
              onClick={handleTrim}
            >
              Trim Audio
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
}
