export type Color = "red" | "yellow" | "green" | "blue" | "wild";

export type Value = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" |
                    "skip" | "reverse" | "draw2" | "wild" | "wild_draw4";

export interface Card {
    id: string;
    color: Color;
    value: Value;
}