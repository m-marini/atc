import _ from 'lodash';
import {
  buildParserContext, errorIfNotEnd, concat, error, drop, optRegex, optWord, word, optDict, all, ifThenElse, ifDropThenElse, any, repeat, optNum,
  optAlpha, optAlphaNum, flightId, atc, flightLevel,
  command,
  runway,
  must
} from './modules/CommandInterpreter';
import { buildClimbCommand, buildDescendCommand, buildFlyToCommand, buildHoldCommand, buildHoldShortCommand, buildLandCommand, buildMaintainCommand, buildTakeoffCommand, MessageTag } from './modules/Message';
import { multipleTestWithData } from './TestUtil';

describe('context', () => {

  multipleTestWithData([
    { text: '', expected: [] },
    { text: '   abc s   dd  ', expected: ['abc', 's', 'dd'] },
    { text: '123 456', expected: ['123', '456'] },
    { text: '123,.-456', expected: ['123', '-456'] },
    { text: '1ABC,.-456', expected: ['1abc', '-456'] }
  ],
    ({ text, expected }: { text: string, expected: string[] }) => {
      test(`build from '${text}'`, () => {
        const result = buildParserContext(text);
        expect(result.props.tokens).toEqual(expected);
      });
    });

  test('empty context', () => {
    const ctx = buildParserContext('');
    expect(ctx.token()).toBe(undefined);
    expect(ctx.next()).toBe(ctx);
  });

  test('one token context', () => {
    const ctx = buildParserContext('a');
    expect(ctx.token()).toBe('a');
    expect(ctx.next().token()).toBe(undefined);
  });

  test('push', () => {
    const ctx = buildParserContext('');
    const result = ctx.push('a');
    expect(result.props.stack).toEqual(['a']);
  });

  test('drop', () => {
    const ctx = buildParserContext('');
    const result = ctx.push('a').drop();
    expect(result.props.stack).toEqual([]);
  });

  test('pop(2)', () => {
    const ctx = buildParserContext('');
    const result = ctx.push('a').push('b').push('c').drop(2);
    expect(result.props.stack).toEqual(['a']);
  });
});

describe('end expression', () => {
  test('true', () => {
    const result = errorIfNotEnd(buildParserContext(''));
    expect(result).toBe(result);
  });

  test('error', () => {
    expect(() => {
      errorIfNotEnd(buildParserContext('a'));
    }).toThrow('end-expected');
  })
});

describe('concat expression', () => {
  multipleTestWithData([
    { data: [undefined, 'a'], exp: ['a'] },
    { data: ['a', undefined], exp: ['a'] },
    { data: ['a', 'b'], exp: ['ab'] },
    { data: [undefined, undefined], exp: [undefined] }
  ], ({ data, exp }) => {
    test(`test [${data}]`, () => {
      const result = concat(buildParserContext('').push(data[0]).push(data[1]));
      expect(result.props.stack).toEqual(exp);
    });
  });
});

describe('error expression', () => {
  test('error', () => {
    expect(() => {
      error('code')(buildParserContext(''));
    }).toThrow('code');
  });
});

describe('drop expression', () => {
  test('drop', () => {
    const result = drop()(buildParserContext('').push('a').push('b'));
    expect(result.props.stack).toEqual(['a']);
  });
  test('drop', () => {
    const result = drop(2)(buildParserContext('').push('a').push('b'));
    expect(result.props.stack).toEqual([]);
  });
});

describe('opt regular expre', () => {
  const expr = optRegex(/^a\d$/);

  multipleTestWithData([
    { text: 'a1', exp: 'a1', curs: 1 },
    { text: 'a2', exp: 'a2', curs: 1 },
    { text: '', exp: undefined, curs: 0 },
    { text: 'a1a1', exp: undefined, curs: 0 }
  ], ({ text, exp, curs }) => {
    test(`text '${text}' `, () => {
      const result = expr(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual([exp]);
    });
  });
});

describe('opt word expression', () => {
  const expr = optWord('cleared');
  multipleTestWithData([
    { text: 'cleared', exp: 'cleared', curs: 1 },
    { text: 'clear', exp: 'cleared', curs: 1 },
    { text: '', exp: undefined, curs: 0 },
    { text: 'a1a1', exp: undefined, curs: 0 }
  ], ({ text, exp, curs }) => {
    test(`text '${text}'`, () => {
      const result = expr(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual([exp]);
    });
  });
});

describe('word expression', () => {
  const expr = word('cleared');

  multipleTestWithData([
    { text: 'cleared', exp: [], curs: 1 },
    { text: 'clear', exp: [], curs: 1 }
  ], ({ text, exp, curs }) => {
    test(`text '${text}' `, () => {
      const result = expr(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual(exp);
    });
  });

  multipleTestWithData([
    { text: '', exp: 'partial-command' },
    { text: 'b', exp: 'word-expected' }
  ], ({ text, exp }) => {
    test(`text: '${text}'`, () => {
      expect(() => {
        const result = expr(buildParserContext(text));
      }).toThrow(exp);
    })
  })
});

describe('opt from dictionary', () => {
  const expr = optDict({
    right: 'r',
    left: 'l',
    center: 'c'
  });
  multipleTestWithData([
    { text: 'right', exp: 'r', curs: 1 },
    { text: 'left', exp: 'l', curs: 1 },
    { text: 'center', exp: 'c', curs: 1 },
    { text: '', exp: undefined, curs: 0 },
    { text: 'bravo', exp: undefined, curs: 0 },
  ], ({ text, exp, curs }) => {
    test(`text [${text}]`, () => {
      const result = expr(buildParserContext(text));
      expect(result.props.stack).toEqual([exp]);
      expect(result.props.cursor).toEqual(curs);
    });
  });
});

describe('all', () => {
  const expr = all(optWord('a'), optWord('b'));
  multipleTestWithData([
    { text: 'a', stack: ['a', undefined], curs: 1 },
    { text: 'a b', stack: ['a', 'b'], curs: 2 },
    { text: 'b a', stack: [undefined, 'b'], curs: 1 },
    { text: 'c a', stack: [undefined, undefined], curs: 0 },
    { text: '', stack: [undefined, undefined], curs: 0 },
  ], ({ text, stack, curs }) => {
    test(`text [${text}]`, () => {
      const result = expr(buildParserContext(text));
      expect(result.props.stack).toEqual(stack);
      expect(result.props.cursor).toEqual(curs);
    });
  });
});

describe('if then else', () => {
  const expr = all(optWord('a'), ifThenElse(optWord('b'), optWord('c')));
  multipleTestWithData([
    { text: 'a b', stack: ['a', 'b'], curs: 2 },
    { text: 'a c', stack: ['a', undefined], curs: 1 },
    { text: 'c', stack: [undefined, 'c'], curs: 1 },
    { text: 'b', stack: [undefined, undefined], curs: 0 },
    { text: '', stack: [undefined, undefined], curs: 0 },
  ], ({ text, stack, curs }) => {
    test(`text [${text}]`, () => {
      const result = expr(buildParserContext(text));
      expect(result.props.stack).toEqual(stack);
      expect(result.props.cursor).toEqual(curs);
    });
  });
});

describe('if drop then else', () => {
  const expr = all(optWord('a'), ifDropThenElse(optWord('b'), optWord('c')));
  multipleTestWithData([
    { text: 'a b', stack: ['b'], curs: 2 },
    { text: 'a c', stack: [undefined], curs: 1 },
    { text: 'c', stack: ['c'], curs: 1 },
    { text: 'b', stack: [undefined], curs: 0 },
    { text: '', stack: [undefined], curs: 0 },
  ], ({ text, stack, curs }) => {
    test(`text [${text}]`, () => {
      const result = expr(buildParserContext(text));
      expect(result.props.stack).toEqual(stack);
      expect(result.props.cursor).toEqual(curs);
    });
  });
});

describe('any', () => {
  const expr = any(optWord('a'), optWord('b'), optWord('c'));
  multipleTestWithData([
    { text: 'a', stack: ['a'], curs: 1 },
    { text: 'b', stack: ['b'], curs: 1 },
    { text: 'c', stack: ['c'], curs: 1 },
    { text: 'd', stack: [undefined], curs: 0 },
    { text: '', stack: [undefined], curs: 0 }
  ], ({ text, stack, curs }) => {
    test(`text [${text}]`, () => {
      const result = expr(buildParserContext(text));
      expect(result.props.stack).toEqual(stack);
      expect(result.props.cursor).toEqual(curs);
    });
  });
});

describe('recursive', () => {
  const expr = repeat(optWord('a'), concat);
  multipleTestWithData([
    { text: 'a', stack: ['a'], curs: 1 },
    { text: 'a a', stack: ['aa'], curs: 2 },
    { text: 'a a a', stack: ['aaa'], curs: 3 },
    { text: 'a a a b', stack: ['aaa'], curs: 3 },
    { text: '', stack: [undefined], curs: 0 },
    { text: 'b', stack: [undefined], curs: 0 }
  ], ({ text, stack, curs }) => {
    test(`text [${text}]`, () => {
      const result = expr(buildParserContext(text));
      expect(result.props.stack).toEqual(stack);
      expect(result.props.cursor).toEqual(curs);
    });
  });
});

describe('opt num expression', () => {
  multipleTestWithData([
    { text: '0123456789', exp: '0123456789', curs: 1 },
    { text: 'zero', exp: '0', curs: 1 },
    { text: 'one', exp: '1', curs: 1 },
    { text: 'two', exp: '2', curs: 1 },
    { text: 'to', exp: '2', curs: 1 },
    { text: 'three', exp: '3', curs: 1 },
    { text: 'four', exp: '4', curs: 1 },
    { text: 'five', exp: '5', curs: 1 },
    { text: 'six', exp: '6', curs: 1 },
    { text: 'seven', exp: '7', curs: 1 },
    { text: 'eight', exp: '8', curs: 1 },
    { text: 'nine', exp: '9', curs: 1 },
    { text: 'niner', exp: '9', curs: 1 },
    { text: '0 10', exp: '010', curs: 2 },
    { text: '0 10 alpha', exp: '010', curs: 2 },
    { text: 'zero one', exp: '01', curs: 2 },
    { text: 'zero one alpha', exp: '01', curs: 2 },
    { text: '', exp: undefined, curs: 0 },
    { text: 'a', exp: undefined, curs: 0 },
    { text: '0123a', exp: undefined, curs: 0 }
  ], ({ text, exp, curs }) => {
    test(`text [${text}]`, () => {
      const result = optNum(buildParserContext(text));
      expect(result.props.stack).toEqual([exp]);
      expect(result.props.cursor).toEqual(curs);
    });
  });
});

describe('opt alpha expression', () => {
  multipleTestWithData([
    { text: 'alpha', exp: 'a', curs: 1 },
    { text: 'bravo', exp: 'b', curs: 1 },
    { text: 'charlie', exp: 'c', curs: 1 },
    { text: 'delta', exp: 'd', curs: 1 },
    { text: 'echo', exp: 'e', curs: 1 },
    { text: 'foxtrot', exp: 'f', curs: 1 },
    { text: 'fox-trot', exp: 'f', curs: 1 },
    { text: 'golf', exp: 'g', curs: 1 },
    { text: 'hotel', exp: 'h', curs: 1 },
    { text: 'india', exp: 'i', curs: 1 },
    { text: 'juliet', exp: 'j', curs: 1 },
    { text: 'kilo', exp: 'k', curs: 1 },
    { text: 'lima', exp: 'l', curs: 1 },
    { text: 'mike', exp: 'm', curs: 1 },
    { text: 'november', exp: 'n', curs: 1 },
    { text: 'oscar', exp: 'o', curs: 1 },
    { text: 'papa', exp: 'p', curs: 1 },
    { text: 'quebec', exp: 'q', curs: 1 },
    { text: 'rebec', exp: 'q', curs: 1 },
    { text: 'romeo', exp: 'r', curs: 1 },
    { text: 'sierra', exp: 's', curs: 1 },
    { text: 'tango', exp: 't', curs: 1 },
    { text: 'uniform', exp: 'u', curs: 1 },
    { text: 'victor', exp: 'v', curs: 1 },
    { text: 'whiskey', exp: 'w', curs: 1 },
    { text: 'x-ray', exp: 'x', curs: 1 },
    { text: 'yankee', exp: 'y', curs: 1 },
    { text: 'zulu', exp: 'z', curs: 1 },
    { text: 'alpha bravo', exp: 'ab', curs: 2 },
    { text: 'alpha one', exp: 'a', curs: 1 },
    { text: 'alpha bravo one', exp: 'ab', curs: 2 },
    { text: '', exp: undefined, curs: 0 },
    { text: 'a', exp: undefined, curs: 0 },
    { text: '0', exp: undefined, curs: 0 },
    { text: '0123a', exp: undefined, curs: 0 }
  ], ({ text, exp, curs }) => {
    test(`text [${text}]`, () => {
      const result = optAlpha(buildParserContext(text));
      expect(result.props.stack).toEqual([exp]);
      expect(result.props.cursor).toEqual(curs);
    });
  });
});

describe('opt alphanum expression', () => {
  multipleTestWithData([
    { text: 'alpha', exp: 'a', curs: 1 },
    { text: 'bravo', exp: 'b', curs: 1 },
    { text: 'charlie', exp: 'c', curs: 1 },
    { text: 'delta', exp: 'd', curs: 1 },
    { text: 'echo', exp: 'e', curs: 1 },
    { text: 'foxtrot', exp: 'f', curs: 1 },
    { text: 'fox-trot', exp: 'f', curs: 1 },
    { text: 'golf', exp: 'g', curs: 1 },
    { text: 'hotel', exp: 'h', curs: 1 },
    { text: 'india', exp: 'i', curs: 1 },
    { text: 'juliet', exp: 'j', curs: 1 },
    { text: 'kilo', exp: 'k', curs: 1 },
    { text: 'lima', exp: 'l', curs: 1 },
    { text: 'mike', exp: 'm', curs: 1 },
    { text: 'november', exp: 'n', curs: 1 },
    { text: 'oscar', exp: 'o', curs: 1 },
    { text: 'papa', exp: 'p', curs: 1 },
    { text: 'quebec', exp: 'q', curs: 1 },
    { text: 'rebec', exp: 'q', curs: 1 },
    { text: 'romeo', exp: 'r', curs: 1 },
    { text: 'sierra', exp: 's', curs: 1 },
    { text: 'tango', exp: 't', curs: 1 },
    { text: 'uniform', exp: 'u', curs: 1 },
    { text: 'victor', exp: 'v', curs: 1 },
    { text: 'whiskey', exp: 'w', curs: 1 },
    { text: 'x-ray', exp: 'x', curs: 1 },
    { text: 'yankee', exp: 'y', curs: 1 },
    { text: 'zulu', exp: 'z', curs: 1 },
    { text: '0123456789', exp: '0123456789', curs: 1 },
    { text: 'zero', exp: '0', curs: 1 },
    { text: 'one', exp: '1', curs: 1 },
    { text: 'two', exp: '2', curs: 1 },
    { text: 'to', exp: '2', curs: 1 },
    { text: 'three', exp: '3', curs: 1 },
    { text: 'four', exp: '4', curs: 1 },
    { text: 'five', exp: '5', curs: 1 },
    { text: 'six', exp: '6', curs: 1 },
    { text: 'seven', exp: '7', curs: 1 },
    { text: 'eight', exp: '8', curs: 1 },
    { text: 'nine', exp: '9', curs: 1 },
    { text: 'niner', exp: '9', curs: 1 },
    { text: '', exp: undefined, curs: 0 },
    { text: 'a', exp: undefined, curs: 0 },
    { text: '0123a', exp: undefined, curs: 0 }
  ], ({ text, exp, curs }) => {
    test(`text '${text}'`, () => {
      const result = optAlphaNum(buildParserContext(text));
      expect(result.props.stack).toEqual([exp]);
      expect(result.props.cursor).toEqual(curs);
    });
  });
});

describe('must', () => {
  const expr = all(optAlpha, must('id-expected'));
  test(`text 'alpha'`, () => {
    const result = expr(buildParserContext('alpha'));
    expect(result.props.stack).toEqual(['a']);
    expect(result.props.cursor).toEqual(1);
  });


  multipleTestWithData([
    { text: '', exp: 'partial-command' },
    { text: 'b', exp: 'id-expected' }
  ], ({ text, exp }) => {
    test(`text: '${text}'`, () => {
      expect(() => {
        const result = expr(buildParserContext(text));
      }).toThrow(exp);
    })
  })
});

describe('flight id expression', () => {
  multipleTestWithData([
    { text: 'alpha', exp: 'a', curs: 1 },
    { text: '0', exp: '0', curs: 1 },
    { text: 'one', exp: '1', curs: 1 },
    { text: 'bravo charlie', exp: 'bc', curs: 2 },
    { text: 'bravo 1', exp: 'b1', curs: 2 },
    { text: 'bravo 1 charlie', exp: 'b1c', curs: 3 },
    { text: 'bravo 1 charlie bho', exp: 'b1c', curs: 3 }
  ], ({ text, exp, curs }) => {
    test(`text '${text}'`, () => {
      const result = flightId(buildParserContext(text));
      expect(result.props.stack).toEqual([exp]);
      expect(result.props.cursor).toEqual(curs);
    });
  });

  multipleTestWithData([
    { text: '', exp: 'partial-command' },
    { text: 'other', exp: 'flight-id' }
  ], ({ text, exp }) => {
    test(`text '${text}'`, () => {
      expect(() => {
        flightId(buildParserContext(text));
      }).toThrowError(exp);
    });
  });
});

describe('atc expression', () => {
  multipleTestWithData([
    { text: 'london atc', exp: 'lon', curs: 2 },
    { text: 'paris atc', exp: 'par', curs: 2 },
    { text: 'munich atc', exp: 'mun', curs: 2 },
    { text: 'milan atc', exp: 'mil', curs: 2 },
    { text: 'frankfurt atc', exp: 'ffm', curs: 2 },
    { text: 'london atc aa', exp: 'lon', curs: 2 }
  ], ({ text, exp, curs }) => {
    test(`text '${text}'`, () => {
      const result = atc(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual([exp]);
    });
  });

  multipleTestWithData([
    { text: '', exp: 'partial-command' },
    { text: 'london', exp: 'partial-command' },
    { text: 'other', exp: 'atc-expected' },
    { text: 'london other', exp: 'word-expected' }
  ], ({ text, exp }) => {
    test(`text '${text}'`, () => {
      expect(() => {
        atc(buildParserContext(text));
      }).toThrowError(exp);
    });
  });
});

describe('flight level expression', () => {
  multipleTestWithData([
    { text: '0 4 0', exp: '040', curs: 3 },
    { text: 'flight level 240', exp: '240', curs: 3 },
    { text: '0 4 0 other', exp: '040', curs: 3 },
    { text: 'flight level 240 other', exp: '240', curs: 3 }
  ], ({ text, exp, curs }) => {
    test(`text [${text}]`, () => {
      const result = flightLevel(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual([exp]);
    });
  });

  multipleTestWithData([
    { text: '0 4 0', exp: '040', curs: 3 },
    { text: 'flight level 240', exp: '240', curs: 3 },
    { text: '0 4 0 other', exp: '040', curs: 3 },
    { text: 'flight level 240 other', exp: '240', curs: 3 }
  ], ({ text, exp, curs }) => {
    test(`text [${text}]`, () => {
      const result = flightLevel(buildParserContext(text).push('a'));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual(['a', exp]);
    });
  });

  multipleTestWithData([
    { text: '', exp: 'partial-command' },
    { text: 'flight', exp: 'partial-command' },
    { text: 'flight level', exp: 'partial-command' },
    { text: 'other', exp: 'flight-level-expected' },
    { text: 'flight 1', exp: 'word-expected' },
    { text: 'flight level other', exp: 'flight-level-expected' },
  ], ({ text, exp }) => {
    test(`text [${text}]`, () => {
      expect(() => {
        flightLevel(buildParserContext(text));
      }).toThrowError(exp);
    });
  });
});

describe('command error', () => {
  multipleTestWithData([
    { text: '', ex: 'partial-command' },
    { text: 'other', ex: 'flight-id-expected' },
    { text: 'alpha 1', ex: 'partial-command' },
    { text: 'alpha 1 london', ex: 'partial-command' },
    { text: 'alpha 1 london atc', ex: 'partial-command' },
    { text: 'alpha 1 other', ex: 'atc-expected' },
    { text: 'alpha 1 london atc other', ex: 'command-expected' },
  ], ({ text, ex }) => {
    test(`text '${text}'`, () => {
      expect(() => {
        command(buildParserContext(text));
      }).toThrowError(ex);
    });
  });
});

describe('climb command', () => {
  multipleTestWithData([
    {
      text: 'alpha 1 london atc climb to flight level 040',
      stack: [buildClimbCommand('A1', 'LON', '040', [MessageTag.VoiceMessage])],
      curs: 9
    },
    {
      text: 'alpha 1 london atc climb to 040',
      stack: [buildClimbCommand('A1', 'LON', '040', [MessageTag.VoiceMessage])],
      curs: 7
    }
  ], ({ text, stack, curs }) => {
    test(`text '${text}'`, () => {
      const result = command(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual(stack);
    });
  });

  multipleTestWithData([
    { text: 'alpha 1 london atc climb', ex: 'partial-command' },
    { text: 'alpha 1 london atc climb to', ex: 'partial-command' },
    { text: 'alpha 1 london atc climb to flight', ex: 'partial-command' },
    { text: 'alpha 1 london atc climb to flight level', ex: 'partial-command' },
    { text: 'alpha 1 london atc climb other', ex: 'word-expected' },
    { text: 'alpha 1 london atc climb to other', ex: 'flight-level-expected' },
    { text: 'alpha 1 london atc climb to flight level 040 other', ex: 'end-expected' }
  ], ({ text, ex }) => {
    test(`text '${text}'`, () => {
      expect(() => {
        command(buildParserContext(text));
      }).toThrowError(ex);
    });
  });
});

describe('descend command', () => {
  multipleTestWithData([
    {
      text: 'alpha 1 london atc descend to flight level 040',
      stack: [buildDescendCommand('A1', 'LON', '040', [MessageTag.VoiceMessage])],
      curs: 9
    },
    {
      text: 'alpha 1 london atc descend to 040',
      stack: [buildDescendCommand('A1', 'LON', '040', [MessageTag.VoiceMessage])],
      curs: 7
    }
  ], ({ text, stack, curs }) => {
    test(`text '${text}'`, () => {
      const result = command(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual(stack);
    });
  });

  multipleTestWithData([
    { text: 'alpha 1 london atc descend', ex: 'partial-command' },
    { text: 'alpha 1 london atc descend to', ex: 'partial-command' },
    { text: 'alpha 1 london atc descend to flight', ex: 'partial-command' },
    { text: 'alpha 1 london atc descend to flight level', ex: 'partial-command' },
    { text: 'alpha 1 london atc descend other', ex: 'word-expected' },
    { text: 'alpha 1 london atc descend to other', ex: 'flight-level-expected' },
    { text: 'alpha 1 london atc descend to flight level 040 other', ex: 'end-expected' }
  ], ({ text, ex }) => {
    test(`text '${text}'`, () => {
      expect(() => {
        command(buildParserContext(text));
      }).toThrowError(ex);
    });
  });
});

describe('maintain command', () => {
  multipleTestWithData([
    {
      text: 'alpha 1 london atc maintain flight level 040',
      stack: [buildMaintainCommand('A1', 'LON', '040', [MessageTag.VoiceMessage])],
      curs: 8
    },
    {
      text: 'alpha 1 london atc maintain 040',
      stack: [buildMaintainCommand('A1', 'LON', '040', [MessageTag.VoiceMessage])],
      curs: 6
    }
  ], ({ text, stack, curs }) => {
    test(`text '${text}'`, () => {
      const result = command(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual(stack);
    });
  });

  multipleTestWithData([
    { text: 'alpha 1 london atc maintain', ex: 'partial-command' },
    { text: 'alpha 1 london atc maintain flight', ex: 'partial-command' },
    { text: 'alpha 1 london atc maintain flight level', ex: 'partial-command' },
    { text: 'alpha 1 london atc maintain other', ex: 'flight-level-expected' },
    { text: 'alpha 1 london atc maintain flight level 040 other', ex: 'end-expected' }
  ], ({ text, ex }) => {
    test(`text '${text}'`, () => {
      expect(() => {
        command(buildParserContext(text));
      }).toThrowError(ex);
    });
  });
});

describe('fly to', () => {
  multipleTestWithData([
    {
      text: 'alpha 1 london atc fly to bravo 2',
      stack: [buildFlyToCommand('A1', 'LON', 'B2', undefined, [MessageTag.VoiceMessage])],
      curs: 8
    }, {
      text: 'alpha 1 london atc fly to bravo 2 via charlie 3',
      stack: [buildFlyToCommand('A1', 'LON', 'B2', 'C3', [MessageTag.VoiceMessage])],
      curs: 11
    }
  ], ({ text, stack, curs }) => {
    test(`text '${text}'`, () => {
      const result = command(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual(stack);
    });
  });

  multipleTestWithData([
    { text: 'alpha 1 london atc fly', ex: 'partial-command' },
    { text: 'alpha 1 london atc fly to', ex: 'partial-command' },
    { text: 'alpha 1 london atc fly to bravo 2 via', ex: 'partial-command' },
    { text: 'alpha 1 london atc fly other', ex: 'word-expected' },
    { text: 'alpha 1 london atc fly to other', ex: 'id-expected' },
    { text: 'alpha 1 london atc fly to bravo 2 other', ex: 'end-expected' },
    { text: 'alpha 1 london atc fly to bravo 2 via other', ex: 'id-expected' },
    { text: 'alpha 1 london atc fly to bravo 2 via charlie 3 other', ex: 'end-expected' },

  ], ({ text, ex }) => {
    test(`text '${text}'`, () => {
      expect(() => {
        command(buildParserContext(text));
      }).toThrowError(ex);
    });
  });
});

describe('hold', () => {
  multipleTestWithData([
    {
      text: 'alpha 1 london atc hold at current position',
      stack: [buildHoldCommand('A1', 'LON', undefined, [MessageTag.VoiceMessage])],
      curs: 8
    }, {
      text: 'alpha 1 london atc hold at bravo 2',
      stack: [buildHoldCommand('A1', 'LON', 'B2', [MessageTag.VoiceMessage])],
      curs: 8
    }
  ], ({ text, stack, curs }) => {
    test(`text '${text}'`, () => {
      const result = command(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual(stack);
    });
  });

  multipleTestWithData([
    { text: 'alpha 1 london atc hold', ex: 'partial-command' },
    { text: 'alpha 1 london atc hold at', ex: 'partial-command' },
    { text: 'alpha 1 london atc hold at current', ex: 'partial-command' },
    { text: 'alpha 1 london atc hold other', ex: 'word-expected' },
    { text: 'alpha 1 london atc hold at other', ex: 'id-expected' },
    { text: 'alpha 1 london atc hold at bravo 2 other', ex: 'end-expected' },
    { text: 'alpha 1 london atc hold at current other', ex: 'word-expected' },
    { text: 'alpha 1 london atc hold at current position other', ex: 'end-expected' },
  ], ({ text, ex }) => {
    test(`text '${text}'`, () => {
      expect(() => {
        command(buildParserContext(text));
      }).toThrowError(ex);
    });
  });
});

describe('rwy id', () => {
  multipleTestWithData([
    { text: '1 2 right', exp: '12r', curs: 3 },
    { text: '34 left', exp: '34l', curs: 2 },
    { text: 'zero one center', exp: '01c', curs: 3 },
    { text: '1 3', exp: '13', curs: 2 },
    { text: '1 3 alpha', exp: '13', curs: 2 },
    { text: 'runway 1 3', exp: '13', curs: 3 },
    { text: 'railway 1 3', exp: '13', curs: 3 }
  ], ({ text, exp, curs }) => {
    test(`text [${text}]`, () => {
      const result = runway(buildParserContext(text));
      expect(result.props.stack).toEqual([exp]);
      expect(result.props.cursor).toEqual(curs);
    });
  });

  multipleTestWithData([
    { text: '', ex: 'partial-command' },
    { text: 'runway', ex: 'partial-command' },
    { text: 'other', ex: 'runway-expected' },
    { text: 'runway other', ex: 'runway-expected' }
  ], ({ text, ex }) => {
    test(`text '${text}'`, () => {
      expect(() => {
        runway(buildParserContext(text));
      }).toThrowError(ex);
    });
  });
});

describe('clear to land', () => {
  multipleTestWithData([
    {
      text: 'alpha 1 london atc cleared to land 36',
      stack: [buildLandCommand('A1', 'LON', '36', [MessageTag.VoiceMessage])],
      curs: 8
    }, {
      text: 'alpha 1 london atc cleared to land 36',
      stack: [buildLandCommand('A1', 'LON', '36', [MessageTag.VoiceMessage])],
      curs: 8
    }, {
      text: 'alpha 1 london atc cleared to land runway 3 6 center',
      stack: [buildLandCommand('A1', 'LON', '36C', [MessageTag.VoiceMessage])],
      curs: 11
    }
  ], ({ text, stack, curs }) => {
    test(`text [${text}]`, () => {
      const result = command(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual(stack);
    });
  });

  multipleTestWithData([
    { text: 'alpha 1 london atc cleared', ex: 'partial-command' },
    { text: 'alpha 1 london atc cleared to', ex: 'partial-command' },
    { text: 'alpha 1 london atc cleared to land', ex: 'partial-command' },
    { text: 'alpha 1 london atc cleared to land runway', ex: 'partial-command' },
    { text: 'alpha 1 london atc cleared other', ex: 'word-expected' },
    { text: 'alpha 1 london atc cleared to other', ex: 'word-expected' },
    { text: 'alpha 1 london atc cleared to land other', ex: 'runway-expected' },
    { text: 'alpha 1 london atc cleared to land 36 other', ex: 'end-expected' }
  ], ({ text, ex }) => {
    test(`text [${text}]`, () => {
      expect(() => {
        command(buildParserContext(text));
      }).toThrowError(ex);
    });
  });
});

describe('clear to takeoff', () => {
  multipleTestWithData([
    {
      text: 'alpha 1 london atc 36 cleared to take off climb to 040',
      stack: [buildTakeoffCommand('A1', 'LON', '36', '040', [MessageTag.VoiceMessage])],
      curs: 12
    }, {
      text: 'alpha 1 london atc 36 cleared to takeoff climb to 040',
      stack: [buildTakeoffCommand('A1', 'LON', '36', '040', [MessageTag.VoiceMessage])],
      curs: 11
    }, {
      text: 'alpha 1 london atc runway 3 6 center cleared to takeoff climb to flight level 0 4 0',
      stack: [buildTakeoffCommand('A1', 'LON', '36C', '040', [MessageTag.VoiceMessage])],
      curs: 18
    }
  ], ({ text, stack, curs }) => {
    test(`text [${text}]`, () => {
      const result = command(buildParserContext(text));
      expect(result.props.cursor).toEqual(curs);
      expect(result.props.stack).toEqual(stack);
    });
  });

  multipleTestWithData([
    { text: 'alpha 1 london atc 36', ex: 'partial-command' },
    { text: 'alpha 1 london atc runway 36', ex: 'partial-command' },
    { text: 'alpha 1 london atc runway 36 cleared', ex: 'partial-command' },
    { text: 'alpha 1 london atc runway 36 cleared to', ex: 'partial-command' },
    { text: 'alpha 1 london atc runway 36 cleared to takeoff', ex: 'partial-command' },
    { text: 'alpha 1 london atc runway 36 cleared to takeoff climb', ex: 'partial-command' },
    { text: 'alpha 1 london atc runway 36 cleared to takeoff climb to', ex: 'partial-command' },
    { text: 'alpha 1 london atc runway 36 cleared to takeoff climb to flight', ex: 'partial-command' },
    { text: 'alpha 1 london atc runway 36 cleared to takeoff climb to flight level', ex: 'partial-command' },
    { text: 'alpha 1 london atc 36 other', ex: 'word-expected' },
    { text: 'alpha 1 london atc 36 cleared other', ex: 'word-expected' },
    { text: 'alpha 1 london atc 36 cleared to other', ex: 'word-expected' },
    { text: 'alpha 1 london atc 36 cleared to takeoff other', ex: 'word-expected' },
    { text: 'alpha 1 london atc 36 cleared to takeoff climb other', ex: 'word-expected' },
    { text: 'alpha 1 london atc 36 cleared to takeoff climb to other', ex: 'flight-level-expected' },
    { text: 'alpha 1 london atc 36 cleared to takeoff climb to 040 other', ex: 'end-expected' },
  ], ({ text, ex }) => {
    test(`text [${text}]`, () => {
      expect(() => {
        command(buildParserContext(text));
      }).toThrowError(ex);
    });
  });
});
