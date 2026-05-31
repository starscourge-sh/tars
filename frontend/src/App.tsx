import React, { useEffect, useState } from 'react'
import { evaluate } from 'mathjs'
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

function App() {
  const [input, setInput] = useState<any>("")
  const [evaluation, setEvaluation] = useState<String>("")
  const [fuzzyOptions, setFuzzyoptions] = useState<String[]>([])

  console.log(input)
  console.log(evaluation)

  useEffect(() => {
    try {
      var r = evaluate(input)
      r.toString()
      setEvaluation(r.toString())
    } catch (err) {
      console.log("[useEffect][catch][🚨] err: ", (err as Error).message)
    } 
    setFuzzyoptions(commands.filter(cmd => cmd.includes(input)))

  }, [input])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text: string = e.target.value
    setInput(text)
  }

  return (
    <div className='bg-gray-900 h-screen p-1 text-white'>
      <div className='flex flex-col gap-3'>
        <div className=''>
          <input
            type='text'
            placeholder='Search apps and commands...'
            className='py-1 px-4 bg-gray-700 w-full'
            onChange={onChange}
          />
        </div>
        <div className='bg-gray-800 py-1 px-4 h-[100px]'>
          {evaluation}
        </div>
        <div className='bg-gray-800 py-1 px-4 '>
          {fuzzyOptions.map((opt)=><div>- {opt}</div>)}
        </div>
      </div>
    </div>
  )
}

export default App
