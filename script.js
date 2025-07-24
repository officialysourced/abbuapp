const counterValue = document.getElementById('counter-value');
    const startVoiceRecognitionButton = document.getElementById('start-voice-recognition');
    const speechStatus = document.getElementById('speech-status');

    let count = 0;
    const targetWord = 'shri';
    const targetWordVariation = 'shree';
    let recognition;
    let isListening = false;
    // lastProcessedText will now track the entire transcript (interim + final) that we've processed for counting.
    let lastProcessedTextForCounting = '';
    // This will hold the complete, current transcript being displayed (interim + final combined).
    let currentDisplayTranscript = '';

    function updateCounter() {
        counterValue.textContent = count;
    }

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true; // Essential for real-time counting
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
            speechStatus.textContent = 'Listening continuously... Say "stop" to end.';
            startVoiceRecognitionButton.disabled = true;
            isListening = true;
            lastProcessedTextForCounting = ''; // Reset on start
            currentDisplayTranscript = ''; // Reset on start
            console.log('Speech recognition started.');
        };

        recognition.onresult = (event => {
            let interimTranscript = '';
            let finalTranscript = '';

            // Concatenate all results from the current event
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // The full transcript currently recognized by the engine (interim + final from this event)
            let currentRecognitionOutput = finalTranscript + interimTranscript;

            // Update the display transcript
            currentDisplayTranscript = finalTranscript + interimTranscript; // Show the full latest result

            // Now, determine what's new for counting
            // We compare the full current output with what we last processed
            let combinedCurrentForProcessing = lastProcessedTextForCounting + currentRecognitionOutput; // Hypothetical combination
            let newSegmentForCounting = '';

            // This is the core change: we need to figure out what's new compared to
            // the last time we processed text for counting.
            // A more reliable way is to build the full transcript received *so far*
            // from the results provided by the event and then compare it to `lastProcessedTextForCounting`.

            let fullTranscriptFromEvent = '';
            for (let i = 0; i < event.results.length; ++i) { // Loop from 0 to get the full transcript of all results in this event
                fullTranscriptFromEvent += event.results[i][0].transcript;
            }

            if (fullTranscriptFromEvent.length > lastProcessedTextForCounting.length) {
                newSegmentForCounting = fullTranscriptFromEvent.substring(lastProcessedTextForCounting.length).toLowerCase();
            }

            // Update `lastProcessedTextForCounting` for the *next* event's comparison
            lastProcessedTextForCounting = fullTranscriptFromEvent;

            // Check for stop command in the *final* segment of the current event
            if (finalTranscript.toLowerCase().includes('stop')) {
                speechStatus.textContent = `Heard "stop". Listening stopped.`;
                recognition.stop();
                isListening = false;
                console.log('Stop command detected, recognition stopped.');
                return;
            }

            // Count occurrences in the new, unprocessed segment
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

            // Update speech status to show the most real-time transcript
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
            count = 0; // Reset count for a new session
            updateCounter();
            recognition.start();
        });

    } else {
        speechStatus.textContent = 'Web Speech API is not supported in this browser. Please use Chrome.';
        startVoiceRecognitionButton.disabled = true;
    }

    updateCounter();