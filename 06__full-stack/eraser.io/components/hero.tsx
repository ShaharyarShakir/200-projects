import React from 'react'

function Hero() {
  return (
    <section className="bg-black">
        <div className='flex justify-center items-baseline pt-20'>
        <h2 className='p-2 px-3 border border-white rounded-full text-white text-center'>See What's New | <span className='text-sky-300'>AI Diagram</span></h2>

        </div>
  <div className="lg:flex mx-auto px-4 py-12 max-w-screen-xl h-screen">
    <div className="mx-auto max-w-xl text-center">
      <h1 className="font-extrabold text-sky-300 text-3xl sm:text-5xl">
      Documents & diagrams
        <strong className="sm:block font-extrabold text-white"> 
        for engineering teams. </strong>
      </h1>

      <p className="mt-4 text-slate-200 sm:text-xl/relaxed">
      All-in-one markdown editor, collaborative canvas, and diagram-as-code builder
      </p>

      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <a
          className="block bg-white hover:bg-slate-600 active:bg-red-500 shadow px-12 py-3 rounded focus:outline-none focus:ring w-full sm:w-auto font-medium text-black text-sm"
          href="#"
        >
          Learn More
        </a>

       
      </div>
    </div>
  </div>
</section>
  )
}

export default Hero