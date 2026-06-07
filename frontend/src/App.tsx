import React, { useEffect, useState } from 'react'
import { evaluate, format, parse, round } from 'mathjs'
import './App.css'


//? 🤔 whats the code for the world fifa cup
// escape to turn off current command mode
const commands = [
  "def",
  "tempus",
  "tempus.hour",
  "tempus.today",
  "tempus.week",
  "tempus.month",
  "tempus.year",
  "base64", // defaults to base64.to
  "base64.to",
  "base64.from",
  "binary",
  "binary.to",
  "binary.from",
  "cheat",
  "emoji", // lists emojis then
  "gif", // lists gifs then
  "scratchpad", // opens most recent note
  "scratchpad.list.notes", // list notes
  "scratchpad.new.note", // create new note window
  "color", // defaults to color.picker
  "color.picker",
  "speakwrite",
  "score", // defaults to premier league match schedule
  "score.english.premier", // epl/premier league
  "score.english.premier.table", // epl standings/epl table
  "score.spanish.laliga", // laliga/spanish league
  "score.spanish.laliga.table", // laliga standings/laliga table
  "score.german.bundes", // bundesliga/ german league
  "score.french.a", // liguea/french league
  "score.uefa.champions", // ucl/uefa champtions league
]
// Am i looking for command or giving a currentCmd input
const COMMAND_MODe = {
  CMD_INPUT: 0,
  CMD_AND_APP_SEARCH: 1
} as const;

const SYMBOL_DESCRIPTIONS: Record<string, string> = {
  e: "Euler's number - base of natural logarithms (~2.718)",
  pi: "Pi - ratio of a circle's circumference to its diameter (~3.14159)",
  phi: "The golden ratio (~1.618)",
  tau: "Tau - equal to 2π (~6.283)",
  i: "The imaginary unit - square root of -1",
  Infinity: "Infinity",
  NaN: "Not a Number",
}

function App() {
  const [input, setInput] = useState<string>("")
  const [mathEvaluation, setMathEvaluation] = useState<string>("")
  const [mathEvaluationDescription, setMathEvaluationDescription] = useState<string>("")
  const [mode, setMode] = useState<number>(COMMAND_MODe.CMD_AND_APP_SEARCH)
  const [fuzzyOptions, setFuzzyoptions] = useState<string[]>([])
  const [currentCmd, setCurrentCmd] = useState<string>("")

  useEffect(() => {
    try {
      if (!input) {
        setMathEvaluationDescription("")
        setMathEvaluation("")
      }

      var result = evaluate(input) // calculates the answer
      if (result) {
        // "fixed" means: always show this many digits AFTER the decimal point
        // precision here means decimal places (confusingly, the word changes meaning by mode)
        setMathEvaluation(format(round(result, 2)))

        const node = parse(input)
        if (node.type == "SymbolNode" && SYMBOL_DESCRIPTIONS[node.name]) {
          setMathEvaluationDescription(SYMBOL_DESCRIPTIONS[node.name])
        } else {
          setMathEvaluationDescription("")
        }
      } else {
        setMathEvaluation("")
      }
    } catch (err) {
      console.log("[useEffect][catch][🚨] err: ", (err as Error).message)
      setMathEvaluation("")
    }

    if (mode != COMMAND_MODe.CMD_INPUT) {
      setFuzzyoptions(commands.filter(cmd => cmd.includes(input)))
    }

  }, [input])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text: string = e.target.value
    setInput(text)
  }


  const onkeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == 'Tab') {// Tab key clicked
      if (mode == COMMAND_MODe.CMD_AND_APP_SEARCH) {
        setCurrentCmd(fuzzyOptions[0])
        // Need to either re-parse input or empty it out
        setMode(COMMAND_MODe.CMD_INPUT)
        setInput("")
      } else {
      }
      e.preventDefault()
    } else if (e.key == "Escape") {// Escape key clicked
      e.preventDefault()
      setCurrentCmd("")
      setMode(COMMAND_MODe.CMD_AND_APP_SEARCH)
      setFuzzyoptions(commands)
    }
  }

  return (
    <div className='bg-gray-900 h-screen p-1 text-white'>
      <div className='flex flex-col gap-3'>
        <div className='flex gap-3'>
          {currentCmd && <div className="flex flex-1 bg-gray-700 py-1 px-4">{currentCmd}</div>}
          <input
            type='text'
            value={input}
            placeholder='Search apps and commands...'
            className='py-1 px-4 bg-gray-700 w-full'
            onChange={onChange}
            onKeyDown={onkeydown}
            autoCorrect={"off"}
            spellCheck={false}

          />
        </div>
        <div className='bg-gray-800 py-1 px-4 h-[100px]'>
          {(mathEvaluation) && `${mathEvaluation} : ${mathEvaluationDescription}`}
        </div>
        <div className='bg-gray-800 py-1 px-4 '>
          {fuzzyOptions.map((opt) => <div>- {opt}</div>)}
        </div>
      </div>
    </div>
  )
}

export default App
