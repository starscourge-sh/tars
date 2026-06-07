# TypeScript Learnings — running log

> Problems hit in this project, why they happened, and the rule that generalises to any project.

---

## 12. Typed objects — `Record<K, V>` vs inline types

In JavaScript you just write an object:
```js
const descriptions = { e: "Euler's number", pi: "Pi" }
```

In TypeScript you have two ways to type it:

**Option A — list every key explicitly:**
```ts
const descriptions: { e: string; pi: string } = { e: "Euler's number", pi: "Pi" }
// TypeScript knows EXACTLY which keys are allowed. Add a new key → must update the type too.
```

**Option B — `Record<K, V>` for flexible key sets:**
```ts
const descriptions: Record<string, string> = { e: "Euler's number", pi: "Pi" }
// Any string key, any string value. Add new entries freely without touching the type.
```

`Record<string, string>` is shorthand for "an object where keys are strings and values are strings." Use it when you have an open-ended lookup table you'll keep adding to.

Note: bare `{}` means "any object" — avoid it. `Record<string, string>` is explicit and safe.

**Lookup returns `string | undefined`:**
```ts
const desc = descriptions[node.name]  // TypeScript says: string | undefined
if (desc) {
  setDescription(desc)  // now TypeScript knows it's definitely a string
}
```
Because the key might not exist in the object, TypeScript makes you handle the `undefined` case before using the value.

---

## 13. Type narrowing — proving to TypeScript what type something is

**The problem:**
`parse()` returns a `MathNode` — the base type shared by ALL kinds of nodes. Some nodes have a `name` property (`SymbolNode`), some don't (`OperatorNode`, `ConstantNode`). TypeScript refuses to let you access `node.name` until you prove the node is the right kind.

```ts
const node = parse(input)
node.name  // ❌ TypeScript error — MathNode doesn't always have `name`
```

**Narrowing with a type check:**
```ts
if (node.type === 'SymbolNode') {
  node.name  // ✅ TypeScript now knows this is a SymbolNode, which has `name`
}
```

Inside the `if` block, TypeScript has "narrowed" the type from the broad `MathNode` down to the specific `SymbolNode`. This isn't just for TypeScript's benefit — it also prevents runtime crashes from accessing properties that don't exist.

**You already know this pattern from JavaScript:**
```js
if (typeof value === 'string') {
  value.toUpperCase()  // safe — you checked it's a string first
}
```
Narrowing is the same idea, just applied to object shapes instead of primitives.

**General rule:**
> When TypeScript says a property "does not exist on type X", it's usually because X is a broad/union type. Check a discriminating property first (like `type`, `kind`, or `instanceof`) to narrow it down, then access what you need.

---

## 11. mathjs — `parse` vs `evaluate`, and formatting numbers for display

### parse vs evaluate

- **`evaluate("2 + 2")`** → calculates it → gives you back `4`. Use this when you want the answer.
- **`parse("2 + 2")`** → reads the structure but does NOT calculate → gives you a description of what was typed. Use this when you want to know *what kind of thing* the user typed, not just the result.

**Concrete example of when you need both:**
You want to type `e` and have the app display "Euler's number" as a label alongside the value `2.718`.
- `evaluate("e")` gives you `2.718...` — the value
- `parse("e")` gives you a node with `type: 'SymbolNode'` and `name: 'e'` — the identity

```ts
const node = parse(input)
const result = evaluate(input)

// node.type tells you what kind of thing was typed:
// 'SymbolNode'   → a named thing: e, pi, x
// 'ConstantNode' → a literal number: 42
// 'OperatorNode' → an operation: 2 + 2
// 'FunctionNode' → a function call: sqrt(4)

if (node.type === 'SymbolNode' && SYMBOL_DESCRIPTIONS[node.name]) {
  setDescription(SYMBOL_DESCRIPTIONS[node.name])  // "Euler's number — base of natural logarithms"
}
```

`parse` answers "what did the user mean to type". `evaluate` answers "what does it equal". You need both when showing context alongside the result.

### "Precision" vs "decimal places"

These are different things:
- **Decimal places** = digits after the dot. `3.14` has 2 decimal places.
- **Precision** = total significant digits. `3.14` has 3 digits of precision. `0.00314` also has 3 digits of precision (leading zeros don't count).

`format(result, 2)` uses precision — 2 significant digits total — which is usually NOT what a calculator wants.

### Formatting for display

To show a fixed number of decimal places:
```ts
format(result, { notation: 'fixed', precision: 2 })
// 123.456 → "123.46"
// 4       → "4.00"
```

To avoid trailing zeros on whole numbers:
```ts
parseFloat(result.toFixed(2)).toString()
// 4.00 → "4", 3.14159 → "3.14"
```

**General rule:**
> Use `evaluate` for calculating. Use `format` or `.toFixed()` only at the moment of display — keep the raw number in state, not the formatted string, so you can reformat later if needed.

---

## 9. Importing something you never use

**What happened:**
```ts
import { evaluate, format, parse } from 'mathjs'
// parse was imported but never called anywhere in the file
```

TypeScript strict mode treats unused imports as errors. It wants your imports to only contain things you actually use.

**The fix:** Delete `parse` from the import line.

**General rule:**
> If you import it, use it. If you stop using it, remove it. Most editors (VS Code) will grey out unused imports as a hint.

---

## 10. State with no default value — the `undefined` problem

**What happened:**
```ts
const [mathEvaluation, setMathEvaluation] = useState<MathExpression>()
//                                                                    ^^ empty — no starting value
```
Then:
```tsx
{mathEvaluation.toString()}  // ERROR: mathEvaluation might be undefined
```

When you don't give `useState` a starting value, the state starts as `undefined` — literally nothing. TypeScript then refuses to let you call `.toString()` on it because calling a method on `undefined` would crash the app.

**The fix — two options:**

Option A — give it a starting value so it's never undefined:
```ts
const [mathEvaluation, setMathEvaluation] = useState<MathExpression>("")
```

Option B — only use it when it exists (the `&&` guard):
```tsx
{mathEvaluation && mathEvaluation.toString()}
```
This reads as: "if mathEvaluation has a value, show it — otherwise show nothing."

**General rule:**
> Always give `useState` a starting value that matches the type. If you truly need "nothing" as a valid state, use `null` explicitly and type it as `useState<string | null>(null)` — then TypeScript knows you're handling the empty case intentionally and will force you to check for it before using the value.

---

## 1. `String` (capital S) vs `string` (lowercase s)

**What happened in the code:**
```ts
const [mode, setMode] = useState<String>("")
const [evaluation, setEvaluation] = useState<String>("")
```
Then later:
```ts
if (mode != Command_Mode.CMD_INPUT)  // CMD_INPUT is the number 0
setMode(Command_Mode.CMD_INPUT)      // trying to put a number into a String state
```

**Why TypeScript complained:**
`String` (capital S) is a JavaScript *object wrapper* — it's like a box that contains a string. It is NOT the same as a plain string or a number, so TypeScript refuses to compare it to the number `0` because they can never be equal.

**The fix:**
Always use lowercase `string`. Lowercase `string` is the actual thing you type: `"hello"`. Capital `String` is almost never what you want.

**General rule:**
> In TypeScript, always use lowercase primitives: `string`, `number`, `boolean`. Never `String`, `Number`, `Boolean`.

---

## 2. Using the wrong event type for a keyboard handler

**What happened in the code:**
```ts
const onkeydown = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.keyCode == 9) { ...  // keyCode doesn't exist on ChangeEvent
```
Then it was wired up as:
```tsx
onKeyDown={onkeydown}
```

**Why TypeScript complained:**
`onChange` and `onKeyDown` are two different events. Think of it like:
- `onChange` fires when the text inside the box changes → it tells you *what the new text is*
- `onKeyDown` fires when a key is pressed → it tells you *which key was pressed*

They give you different information. `keyCode` (which key was pressed) only exists on keyboard events, not on change events.

**The fix:**
```ts
const onkeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Tab") { ...   // also: use e.key instead of e.keyCode (keyCode is old/deprecated)
```

**General rule:**
> Match the event type to the prop it's used on. `onChange` → `React.ChangeEvent`. `onKeyDown/onKeyUp/onKeyPress` → `React.KeyboardEvent`. `onClick` → `React.MouseEvent`. TypeScript will tell you if they don't match.

---

## 3. `import type` — when you import something just to use as a label, not to run

**What happened in the code:**
```ts
import { MathExpression } from 'mathjs'
```

**Why TypeScript complained:**
This project has a setting (`verbatimModuleSyntax`) that requires you to be explicit: if you're only importing something to use as a *type label in your code* (like `useState<MathExpression>`) and NOT to actually call it or use it at runtime, you must say `import type`.

Think of it like: some imports are tools you *use* (functions, classes), some imports are just *descriptions* of what a value looks like (types). The setting forces you to say which is which.

**The fix:**
```ts
import type { MathExpression } from 'mathjs'
```

**How to know which to use:**
- Are you calling it like a function? `new Something()`, `Something.method()` → regular import
- Are you only writing it inside `< >` or `: Something` as a label? → `import type`

**General rule:**
> If the word only appears after `:` or inside `<>` in your code and never actually runs, it's a type → use `import type`.

---

## 4. `math` was never imported — using a library without importing it

**What happened in the code:**
```ts
setInput(math.parse(text))   // where did `math` come from?
```
But at the top:
```ts
import { evaluate, format } from 'mathjs'  // only evaluate and format were imported
```

**Why TypeScript complained:**
`math` was never imported. In older JavaScript, some libraries would inject themselves globally (like `math.js` does in a browser `<script>` tag). But in a modern module file (anything with `import` at the top), that global injection doesn't work — you have to explicitly import what you use.

**The fix — two options:**

Option A — import the whole library as `math`:
```ts
import * as math from 'mathjs'
// now math.parse(), math.evaluate(), etc. all work
```

Option B — import only what you need:
```ts
import { evaluate, format, parse } from 'mathjs'
// then use parse() directly, not math.parse()
```

**General rule:**
> In modern JS/TS files, nothing is automatically available. Every function, object, or value you use must be explicitly imported at the top. If TypeScript says "X refers to a UMD global", it means you forgot to import X.

---

## 5. Finding types in a package — and understanding what you find

### How to find them

**Method 1 — hover in VS Code (start here):**
Hover over any function from the library. VS Code shows a popup with the return type. Press F12 ("Go to Definition") to jump to the type definition file. This is the fastest way.

**Method 2 — the `.d.ts` file:**
Every well-maintained npm package ships a file like `node_modules/mathjs/types/index.d.ts`. This is the "menu" of everything the package offers — all its types, all its functions, and what they return. You can search inside it (Ctrl+F) for a type name.

**Method 3 — let TypeScript infer it for you:**
Write the call, store the result in a variable, then hover over that variable:
```ts
const result = evaluate("2+2")
//    ^^^^^^ hover this — VS Code says the type is MathType
```
This is useful when you don't know what a function returns yet.

**Method 4 — `@types/<package>` on npm:**
Some packages don't include types themselves. They rely on a separate community-maintained types package. If you install a library and get no type hints, search npm for `@types/<packagename>` and install that too. Example: `npm install -D @types/lodash`.

---

### How to read what you find

Once you're looking at a `.d.ts` file, it can look overwhelming. Here's how to read the most common patterns:

**A simple type alias — it's just a label for another type:**
```ts
type MathExpression = string | string[] | Matrix | MathCollection
```
This says: `MathExpression` can be any one of those four things. If a function returns this, you can't safely treat it as a plain `string` because it might be a `Matrix`. That's why TypeScript complains when you put it in an input box.

**A function signature — what goes in and what comes out:**
```ts
evaluate(expr: MathExpression, scope?: object): any
//             ^^^^^^^^^^^^^^ what you pass in
//                                             ^^^ what you get back
```
`any` means TypeScript gave up trying to be specific — it could be a number, a Matrix, anything. That's a signal: you need to handle the result carefully or cast it yourself.

**A union type — the `|` symbol means "or":**
```ts
type MathNumericType = number | BigNumber | Fraction | Complex
```
This is a value that could be any of those. If you want to display it, you can't just call `.toFixed()` on it because `.toFixed()` only exists on `number`, not on `BigNumber` or `Complex`.

---

### The practical trick: don't fight the library's types, work around them

Library types are often very wide (lots of possibilities) because the library has to handle every use case. But your code has a specific use case. The pattern is:

1. Call the library function
2. Immediately convert the result to a simple type you control
3. Store that simple type in state — never the library's complex type

```ts
// Bad — storing a library type in state
const [result, setResult] = useState<MathType>()

// Good — evaluate, immediately convert to string, store that
const raw = evaluate(input)              // raw is MathType (complex)
const display = format(raw, { notation: 'fixed', precision: 2 })  // display is string (simple)
setResult(display)                       // store the simple string
```

Think of the library as a kitchen — you take ingredients in (your string expression), it cooks something complex inside, and you take out a finished dish (a formatted string). You don't store the half-cooked ingredients in your fridge.

---

## 6. The `MathExpression` type is too wide — mathjs returns complex types, not plain strings

**What happened in the code:**
```ts
const [input, setInput] = useState<MathExpression>("")
```
Then:
```ts
<input value={input} ...>        // React input wants string | number, not MathExpression
commands.filter(cmd => cmd.includes(input))  // String.includes() wants a string, not MathExpression
setInput(math.parse(text))       // math.parse() returns MathNode, not MathExpression
```

**Why TypeScript complained:**
`MathExpression` in mathjs is defined as:
```ts
type MathExpression = string | string[] | Matrix | MathCollection
```
It's a *union* — it could be any of those four things. React's `<input value>` only accepts `string | number`, so TypeScript refuses because `MathExpression` might be a `Matrix` object.

**The deeper problem:**
You were using `MathExpression` as the state type for a text input box. But that type was designed to describe what mathjs *accepts as input to evaluate*, not what a text box holds.

**The fix:**
Keep the input box state as plain `string`. Only convert to a mathjs type when you're about to evaluate:
```ts
const [input, setInput] = useState<string>("")

// When evaluating:
const result = evaluate(input)   // evaluate() accepts string — no conversion needed

// When parsing (if you need a MathNode):
const parsed = parse(input)      // do this locally, don't store it in state
```

**General rule:**
> Store the simplest possible type in state — usually `string`, `number`, or a plain object you define yourself. Convert to library-specific types only at the moment you call the library function. Don't let library types "leak" into your state.

---

## 7. `autoCorrect={false}` — booleans vs strings in HTML attributes

**What happened in the code:**
```tsx
autoCorrect={false}
```

**Why TypeScript complained:**
The HTML `autocorrect` attribute is a string attribute — it only understands `"on"` or `"off"`. Passing `false` (a boolean) is the wrong type.

**The fix:**
```tsx
autoCorrect="off"
spellCheck={false}   // spellCheck is fine as boolean — React handles this one specially
```

**General rule:**
> HTML attributes have their own types. When TypeScript says "boolean is not assignable to string", check if the attribute expects `"on"/"off"` instead of `true/false`. VS Code hover will show you the expected type.

---

## 8. `text` variable used but never defined

**What happened in the code:**
```ts
const onkeydown = (e: React.ChangeEvent<HTMLInputElement>) => {
  ...
  setInput(math.parse(text))   // `text` — what is this?
```

**Why TypeScript complained:**
`text` doesn't exist inside `onkeydown`. The variable `text` was defined inside `onChange` (a different function), so it's not accessible here.

**The fix:**
Read the current value from the event:
```ts
const value = e.currentTarget.value   // the current text in the input box
setInput(parse(value))
```

Or, for Tab completion specifically, you probably don't want the input text at all — you want the first fuzzy option:
```ts
setInput(fuzzyOptions[0])  // fill input with the first suggestion
```

**General rule:**
> Variables declared with `const`/`let` inside a function only exist inside that function. To share data between handlers, either put it in state (useState), read it from the event (`e.target.value`), or pass it as a parameter.
