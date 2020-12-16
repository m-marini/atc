import { AsyncSubject, interval, Observable } from "rxjs";
import { bufferCount, filter, first, flatMap, map, take, tap } from "rxjs/operators";

const ReadingPollingInterval = 100;
const SpeakingPollingInterval = 100;

/**
 * 
 * @param voices 
 */
function filterEng(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
    return voices.filter(voice => voice.lang.toLowerCase().startsWith('en'));
}

/**
 * 
 */
function getSynth() {
    const synth = window.speechSynthesis;
    const result = { synth, voices: synth ? filterEng(synth.getVoices()) : [] };
    return result;
}

/**
 * Returns the single observable with the list of voices
 */
export function synthVoices(): Observable<SpeechSynthesisVoice[]> {
    return synth().pipe(
        map(v => v.voices)
    );
}

/**
 * 
 */
export function speakingPooling(inter: number = SpeakingPollingInterval): Observable<boolean> {
    return interval(inter).pipe(
        flatMap(() => synth()),
        map(v => v.synth.speaking)
    );
}

/**
 * 
 */
export function speakingChange() {
    return (obs: Observable<boolean>) =>
        (obs).pipe(
            bufferCount(2, 1),
            filter(x => x[0] !== x[1]),
            map(x => x[1])
        );
}

const asyncSynth = new AsyncSubject<{
    synth: SpeechSynthesis,
    voices: SpeechSynthesisVoice[]
}>();

interval(ReadingPollingInterval).pipe(
    take(100),
    map(() => getSynth()),
    filter(v => v.voices.length > 0),
    first()
).subscribe(asyncSynth);

/**
 * 
 */
export function synth() {
    return asyncSynth.asObservable();
}

/**
 * Returns the single observable that synthetizes a list of commands or empty observable 
 * if cannot synthetize
 * @param {*} cmds the commad list 'voiceIndex text'
 */
export function synthSay(cmds: string[]): Observable<any> {
    return synth().pipe(
        tap(({ synth, voices }) => {
            cmds.forEach(cmd => {
                const m = /(\d+)\b(.*)/.exec(cmd);
                if (m != null && m.length === 3) {
                    const voice = voices[parseInt(m[1])];
                    const msg = m[2];
                    if (voice) {
                        const utt = new SpeechSynthesisUtterance(msg);
                        utt.voice = voice;
                        // utt.rate = 1.2;
                        synth.speak(utt);
                    }
                }
            })
        })
    );
}
