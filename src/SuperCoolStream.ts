// SPDX-FileCopyrightText: 2022 - 2024 Gnuxie <Gnuxie@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// SPDX-FileAttributionText: <text>
// This modified file incorporates work from super-cool-stream
// https://github.com/Gnuxie/super-cool-stream
// </text>

export interface SuperCoolStream<Item, Sequence> {
  readonly source: Sequence;
  peekItem<EOF = undefined>(eof: EOF): Item | EOF;
  readItem<EOF = undefined>(eof: EOF): Item | EOF;
  getPosition(): number;
  setPosition(n: number): void;
  clone(): SuperCoolStream<Item, Sequence>;
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
    start = 0
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

  public setPosition(n: number) {
    this.position = n;
  }

  public clone(): SuperCoolStream<Item, Sequence> {
    return new StandardSuperCoolStream(this.source, this.position);
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

  public clone(): StringStream {
    return new StringStream(this.source, this.position);
  }
}

/**
 * Tracks columns and rows. Can't handle any other line ending than line feed atm.
 */
export class RowTrackingStringStream extends StringStream {
  public constructor(
    source: string,
    position: number,
    private row = 0,
    private column = 0
  ) {
    super(source, position);
  }

  public readItem<EOF = undefined>(eof?: EOF) {
    const item = super.readItem(eof);
    if (item === eof) {
      return item;
    } else if (item === "\n") {
      this.row++;
      this.column = 0;
      return item;
    } else {
      this.column++;
      return item;
    }
  }

  public clone(): RowTrackingStringStream {
    return new RowTrackingStringStream(
      this.source as string,
      this.position,
      this.row,
      this.column
    );
  }
  public get peekRow() {
    return this.row;
  }
  public get peekColumn() {
    return this.column;
  }
  public get readRow() {
    return this.row - 1;
  }
  public get readColumn() {
    if (this.row === 0) {
      if (this.column === 0) {
        return 0;
      }
      return this.column;
    } else {
      return this.column - 1;
    }
  }
}
