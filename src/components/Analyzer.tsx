import { useState } from 'react'
import Comment from './Comment'

interface AnalyzerProps {
  URL: string;
  comments: string[];
}

export default function Analyzer({URL, comments} : AnalyzerProps) {

  return (
    <div className='flex flex-col items-center justify-start pt-20'>
        <div className="mt-8 w-full max-w-xl ">
            {comments.length > 0 ? (
            <ul className="text-white bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                {comments.map((comment, index) => (
                <Comment key={index} text={comment} number={index}/>
                ))} 
            </ul>
            ) : (
            <p className="text-white">No comments fetched yet.</p>
            )}
        </div>
      </div>
  )
}
