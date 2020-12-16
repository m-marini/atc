import React from 'react';
import _ from 'lodash';
import '../App.css';
import { MessageText, Style } from './MessageConverters';
import { toast } from 'react-toastify';

/**
 * 
 */
export class CockpitLogger {
    private _log: MessageText[];
    readonly maxMessages: number;

    constructor(maxMessages: number = 10) {
        this._log = [];
        this.maxMessages = maxMessages;
        _.bindAll(this, ['putMessages']);
    }

    /**
     * 
     */
    get log(): MessageText[] { return this._log; }

    /**
     * 
     */
    putMessages(messages: MessageText[]): CockpitLogger {
        this._log = _(this.log).concat(messages).takeRight(this.maxMessages).value();
        messages.forEach(msg => {
            switch (msg.style) {
                case Style.ATC:
                    toast.dark(
                        <div className="bg-light text-success border-success border rounded p-2">
                            {msg.text}
                        </div>
                    );
                    break;
                case Style.Error:
                    toast.dark(
                        <div className="bg-light text-danger border-danger border rounded p-2">
                            {msg.text}
                        </div>
                    );
                    break;
                default:
                    toast.dark(
                        <div className="bg-light text-dark border-light border rounded p-2">
                            {msg.text}
                        </div>
                    );
                    break;
            }
        });
        return this;
    }
}

/**
 * 
 */
export function cockpitLogger(): CockpitLogger {
    return new CockpitLogger();
}
