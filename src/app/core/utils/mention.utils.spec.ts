import { UserDto } from '../dto';
import {
  CommentSegment,
  extractMentions,
  insertMention,
  matchUsers,
  MentionQuery,
  mentionQueryAt,
  toCommentSegments,
} from './mention.utils';

const user = (id: string, name: string): UserDto => ({ id, name, avatar: '', email: '' });
const SARAH: UserDto = user('u2', 'Sarah Smith');
const SAM: UserDto = user('u5', 'Sam');
const MIKE: UserDto = user('u3', 'Mike Johnson');
const USERS: UserDto[] = [SARAH, SAM, MIKE];

describe('mentionQueryAt', () => {
  it('finds the mention being typed, spaces included', () => {
    expect(mentionQueryAt('hi @Sa', 6)).toEqual({ start: 3, query: 'Sa' });
    expect(mentionQueryAt('@', 1)).toEqual({ start: 0, query: '' });
    expect(mentionQueryAt('cc @Sarah Sm', 12)).toEqual({ start: 3, query: 'Sarah Sm' });
  });

  it('reads up to the caret only', () => {
    expect(mentionQueryAt('@Sarah later', 4)).toEqual({ start: 0, query: 'Sar' });
  });

  it('ignores @ inside a word, after a line break or a leading space', () => {
    expect(mentionQueryAt('mail me@site', 12)).toBeNull();
    expect(mentionQueryAt('@Sam\nnext', 9)).toBeNull();
    expect(mentionQueryAt('@ x', 3)).toBeNull();
    expect(mentionQueryAt('no mention', 5)).toBeNull();
  });

  it('stops once the text after @ is too long to be a name', () => {
    expect(mentionQueryAt(`@${'a'.repeat(31)}`, 32)).toBeNull();
  });
});

describe('matchUsers', () => {
  it('matches the start of the full name or of any word, ignoring case', () => {
    expect(matchUsers(USERS, 'sa')).toEqual([SARAH, SAM]);
    expect(matchUsers(USERS, 'john')).toEqual([MIKE]);
    expect(matchUsers(USERS, 'sarah s')).toEqual([SARAH]);
    expect(matchUsers(USERS, '')).toEqual(USERS);
    expect(matchUsers(USERS, 'zz')).toEqual([]);
  });
});

describe('insertMention', () => {
  it('replaces the typed query with the full name and a space, keeping the rest', () => {
    const mention: MentionQuery = { start: 3, query: 'Sa' };
    expect(insertMention('hi @Sa please', mention, 6, SARAH)).toEqual({
      text: 'hi @Sarah Smith  please',
      caret: 16,
    });
  });
});

describe('extractMentions', () => {
  it('finds each person once, in order, preferring the longest name', () => {
    expect(extractMentions('@Mike Johnson and @Sarah Smith, then @Mike Johnson again', USERS)).toEqual(['u3', 'u2']);
  });

  it('needs the full name as a whole word', () => {
    expect(extractMentions('@Sarah alone', USERS)).toEqual([]);
    expect(extractMentions('@Samantha', USERS)).toEqual([]);
    expect(extractMentions('x@Sam', USERS)).toEqual([]);
    expect(extractMentions('(@Sam)', USERS)).toEqual(['u5']);
  });

  it('handles no users', () => {
    expect(extractMentions('@Sam', [])).toEqual([]);
  });
});

describe('toCommentSegments', () => {
  it('splits text around mentions of the given people only', () => {
    const segments: CommentSegment[] = toCommentSegments('Hi @Sarah Smith, ask @Sam.', [SARAH]);
    expect(segments).toEqual([
      { kind: 'text', text: 'Hi ' },
      { kind: 'mention', text: '@Sarah Smith', userId: 'u2' },
      { kind: 'text', text: ', ask @Sam.' },
    ]);
  });

  it('returns the whole body as text when nobody is mentioned', () => {
    expect(toCommentSegments('plain', [])).toEqual([{ kind: 'text', text: 'plain' }]);
    expect(toCommentSegments('', [])).toEqual([]);
  });

  it('treats regex characters in names literally', () => {
    const odd: UserDto = user('u9', 'A.B (QA)');
    expect(toCommentSegments('@A.B (QA) ok', [odd])[0]).toEqual({ kind: 'mention', text: '@A.B (QA)', userId: 'u9' });
  });
});
