const counterValue = document.getElementById('counter-value');
const startVoiceRecognitionButton = document.getElementById('start-voice-recognition');
const speechStatus = document.getElementById('speech-status');

let count = 0;
const targetWord = 'shri';
const targetWordVariation = 'shree';
let recognition;
let isListening = false;
let lastProcessedTextForCounting = '';
let currentDisplayTranscript = '';

function updateCounter() {
    counterValue.textContent = count;
}

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
        speechStatus.textContent = 'Listening continuously... Say "stop" to end.';
        startVoiceRecognitionButton.disabled = true;
        isListening = true;
        lastProcessedTextForCounting = '';
        currentDisplayTranscript = '';
        console.log('Speech recognition started.');
    };

    recognition.onresult = (event => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        let currentRecognitionOutput = finalTranscript + interimTranscript;

        currentDisplayTranscript = finalTranscript + interimTranscript;

        let newSegmentForCounting = '';

        let fullTranscriptFromEvent = '';
        for (let i = 0; i < event.results.length; ++i) {
            fullTranscriptFromEvent += event.results[i][0].transcript;
        }

        if (fullTranscriptFromEvent.length > lastProcessedTextForCounting.length) {
            newSegmentForCounting = fullTranscriptFromEvent.substring(lastProcessedTextForCounting.length).toLowerCase();
        }

        lastProcessedTextForCounting = fullTranscriptFromEvent;

        if (finalTranscript.toLowerCase().includes('stop')) {
            speechStatus.textContent = `Heard "stop". Listening stopped.`;
            recognition.stop();
            isListening = false;
            console.log('Stop command detected, recognition stopped.');
            return;
        }

        if (newSegmentForCounting.length > 0) {
            let occurrences = 0;
            const wordsInSegment = newSegmentForCounting.split(/\s+|,|\.|\?|!|\(|\)/).filter(word => word.length > 0);

            wordsInSegment.forEach(word => {
                const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase();
                if (cleanWord === targetWord || cleanWord === targetWordVariation) {
                    occurrences++;
                }
            });

            if (occurrences > 0) {
                count += occurrences;
                updateCounter();
                console.log(`Count updated: ${count}. New words: "${newSegmentForCounting}"`);
            }
        }

        speechStatus.textContent = `Listening... "${currentDisplayTranscript}"`;
    });

    recognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        speechStatus.textContent = `Error: ${event.error}. Attempting to restart...`;
        startVoiceRecognitionButton.disabled = false;
        isListening = false;
        console.log('Speech recognition error, trying to restart.');

        if (event.error !== 'not-allowed' && event.error !== 'aborted') {
            setTimeout(() => {
                try {
                    recognition.start();
                    speechStatus.textContent = 'Error, but restarted listening...';
                    isListening = true;
                    lastProcessedTextForCounting = '';
                    currentDisplayTranscript = '';
                    console.log('Speech recognition restarted after error.');
                } catch (e) {
                    speechStatus.textContent = `Error: ${event.error}. Could not restart. Click "Start Listening" again.`;
                    console.error('Failed to restart recognition:', e);
                    isListening = false;
                    startVoiceRecognitionButton.disabled = false;
                }
            }, 1000);
        } else if (event.error === 'not-allowed') {
            speechStatus.textContent = 'Microphone access denied. Please allow microphone access to use this feature.';
        } else {
            speechStatus.textContent = `Listening ended due to: ${event.error}. Click "Start Listening" again.`;
        }
    };

    recognition.onend = () => {
        console.log('Speech recognition ended.');
        if (isListening && !speechStatus.textContent.includes('Heard "stop"')) {
            speechStatus.textContent = 'Listening ended unexpectedly. Restarting...';
            setTimeout(() => {
                try {
                    recognition.start();
                    isListening = true;
                    lastProcessedTextForCounting = '';
                    currentDisplayTranscript = '';
                    console.log('Speech recognition restarted after unexpected end.');
                } catch (e) {
                    speechStatus.textContent = 'Listening ended unexpectedly and could not restart. Click "Start Listening" again.';
                    console.error('Failed to restart recognition on end:', e);
                    isListening = false;
                    startVoiceRecognitionButton.disabled = false;
                }
            }, 100);
        } else {
            if (!speechStatus.textContent.includes('Heard "stop"')) {
                speechStatus.textContent = 'Listening ended. Click "Start Listening" again.';
            }
            isListening = false;
            startVoiceRecognitionButton.disabled = false;
        }
    };

    startVoiceRecognitionButton.addEventListener('click', () => {
        speechStatus.textContent = '';
        count = 0;
        updateCounter();
        recognition.start();
    });

} else {
    speechStatus.textContent = 'Web Speech API is not supported in this browser. Please use Chrome.';
    startVoiceRecognitionButton.disabled = true;
}

updateCounter();
