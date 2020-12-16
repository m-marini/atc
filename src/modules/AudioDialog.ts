import { BehaviorSubject, combineLatest, Observable, Subject } from "rxjs";
import { map, tap, filter } from "rxjs/operators";
import { speakingPooling, synthSay } from "./Audio";
import _ from 'lodash';

const DefaultPolling = 500;
/**
 * 
 * @param param0
 */
const createRecogn: (arg: {
    onresult?: (ev: SpeechRecognitionEvent) => void,
    onnomatch?: (ev: SpeechRecognitionEvent) => void,
    onend?: (ev: Event) => void
    onerror?: (ev: Event) => void
    ondefault?: (ev: Event) => void
}) => SpeechRecognition | undefined
    = ({ ondefault = null, onresult = null, onend = null, onnomatch = null, onerror = null }) => {
        const SpeechRecognition: (new () => SpeechRecognition) | undefined = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!!SpeechRecognition) {
            const recognition = new SpeechRecognition();
            // const speechRecognitionList = new SpeechGrammarList();
            // speechRecognitionList.addFromString(grammar, 1);
            // recognition.grammars = speechRecognitionList;
            recognition.continuous = false;
            recognition.lang = 'en';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = onresult || ondefault;
            recognition.onspeechend = ondefault;
            recognition.onnomatch = onnomatch || ondefault
            recognition.onerror = onerror || ondefault;
            recognition.onstart = ondefault;
            recognition.onaudiostart = ondefault;
            recognition.onsoundstart = ondefault;
            recognition.onspeechstart = ondefault;
            recognition.onspeechend = ondefault;
            recognition.onsoundend = ondefault;
            recognition.onaudioend = ondefault;
            recognition.onend = onend || ondefault;
            return recognition;
            // return undefined;
        } else {
            return undefined;
        }
    };

function cleared(listening: Observable<boolean>, speaking: Observable<boolean>): Observable<boolean> {
    return combineLatest([speaking, listening]).pipe(
        map(([speaking, listening]) => !speaking && !listening),
        filter(cleared => cleared)
    );
}

type AudioDialogProps<T> = Readonly<{
    polling?: number;
    parseSpeech: (arg: string) => T;
    isCompleted: (arg: T) => boolean;
    onSpeech?: (arg: string) => void;
    onRecognized?: (arg: T) => void;
    onListening?: (arg: boolean) => void;
}>;

/**
 * 
 */
export class AudioDialog<T> {
    private _recogn: SpeechRecognition | undefined;
    private _speeches: Subject<string>;
    private _messages: Subject<T>;
    private _listening: Subject<boolean>;
    private _props: AudioDialogProps<T>;
    private _buffer: string[];
    private _speech: string;
    private _listenEnabled: boolean;

    constructor(props: AudioDialogProps<T>) {
        this._props = props;
        this._speeches = new Subject<string>();
        this._messages = new Subject<T>();
        this._listening = new BehaviorSubject<boolean>(false);
        const self = this;
        this._buffer = [];
        this._speech = '';
        this._listenEnabled = false;

        this._recogn = createRecogn({
            onend: ev => {
                self._listening.next(false);
            },
            // onresult: ev => {
            //     console.log('------------------');
            //         _.forEach(ev.results, (element, i) => {
            //         console.log(element.isFinal,
            //             element[0].confidence,
            //             element[0].transcript);
            //     });
            //     console.log('------------------');
            // },
            onresult: ev => {
                const speech = ev.results[0][0].transcript
                this.handleSpeech(speech);
            }
            // ondefault: ev => { console.log(ev.type); }
        });

        const { onSpeech, onListening, onRecognized } = props;
        if (onSpeech) {
            this.speeches().pipe(
                tap(s => onSpeech(s))
            ).subscribe();
        }
        if (onRecognized) {
            this.messages().pipe(
                tap(s => onRecognized(s))
            ).subscribe();
        }
        if (onListening) {
            this.listening().pipe(
                tap(s => {
                    onListening(s);
                })
            ).subscribe();
        }

        const notSpeaking = speakingPooling(props.polling || DefaultPolling).pipe(
            filter(speaking => !speaking)
        );
        cleared(this.listening(), notSpeaking).pipe(
            tap(cleared => self.handleCleared(cleared))
        ).subscribe();
    }

    private get props() { return this._props; }

    private get recogn() { return this._recogn; }

    /**
     * 
     * @param speech 
     */
    private handleSpeech(speech: string) {
        // console.log(speech);
        const sp = (this._speech + ' ' + speech).trim();
        const msg = this.props.parseSpeech(sp);
        if (this.props.isCompleted(msg)) {
            this._messages.next(msg);
            this._speech = '';
            this._speeches.next('');
        } else {
            this._speech = sp;
            this._speeches.next(sp);
        }
    }

    /**
     * 
     */
    private handleCleared(cleared: boolean) {
        if (this._speech === '' && this._buffer.length > 0) {
            const bfr = this._buffer;
            this._buffer = [];
            // console.log('speaking ...');
            synthSay(bfr).subscribe();
        } else if (this.listenEnabled) {
            this.startListening();
        }
    }

    /**
     * 
     */
    private startListening() {
        const rec = this.recogn;
        if (rec) {
            this._listening.next(true);
            // console.log('listening...')
            rec.start();
        }
    }

    speeches() { return this._speeches.asObservable(); }

    /**
     * 
     */
    listening() { return this._listening.asObservable(); }

    /**
     * 
     */
    messages() {
        return this._messages.asObservable();
    }

    /**
     * 
     * @param speeches 
     */
    say(speeches: string[]) {
        const bfr = this._buffer;
        this._buffer = [];
        this._buffer = _.concat(bfr, speeches);
    }

    get listenEnabled() { return this._listenEnabled; }

    /**
     * 
     */
    set listenEnabled(value: boolean) {
        this._listenEnabled = value;
    }
}
