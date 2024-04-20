// SPDX-FileCopyrightText: 2022 - 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface SuperCoolStream<Item, Sequence> {
  readonly source: Sequence;
  peekItem<EOF = undefined>(eof: EOF): Item | EOF;
  readItem<EOF = undefined>(eof: EOF): Item | EOF;
  getPosition(): number;
  savingPositionIf<Result>(description: {
    predicate: (t: Result) => boolean;
    body: (stream: SuperCoolStream<Item, Sequence>) => Result;
  }): Result;
}

interface Indexable<Item> {
  at(position: number): Item | undefined;
}

export class StandardSuperCoolStream<Item, Sequence extends Indexable<Item>>
  implements SuperCoolStream<Item, Sequence>
{
  protected position: number;
  /**
   * Makes the super cool string stream.
   * @param source A string to act as the source of the stream.
   * @param start Where in the string we should start reading.
   */
  constructor(
    public readonly source: Sequence,
    start = 0,
  ) {
    this.position = start;
  }

  public peekItem<EOF = undefined>(eof?: EOF): Item | EOF {
    return this.source.at(this.position) ?? (eof as EOF);
  }

  public readItem<EOF = undefined>(eof?: EOF) {
    return this.source.at(this.position++) ?? (eof as EOF);
  }

  public getPosition(): number {
    return this.position;
  }

  savingPositionIf<Result>(description: {
    predicate: (t: Result) => boolean;
    body: (stream: SuperCoolStream<Item, Sequence>) => Result;
  }): Result {
    const previousPosition = this.position;
    const bodyResult = description.body(this);
    if (description.predicate(bodyResult)) {
      this.position = previousPosition;
    }
    return bodyResult;
  }
}

/**
 * Helper for peeking and reading character by character.
 */
export class StringStream extends StandardSuperCoolStream<
  string,
  Indexable<string>
> {
  public peekChar<EOF = undefined>(eof?: EOF) {
    return this.peekItem(eof);
  }

  public readChar<EOF = undefined>(eof?: EOF) {
    return this.readItem(eof);
  }
}
