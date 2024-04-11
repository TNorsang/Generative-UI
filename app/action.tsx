import { OpenAI } from "openai";
import { createAI, getMutableAIState, render } from "ai/rsc";
import { z } from "zod";

// Grabbing the open ai key from process.env
const openai = new OpenAI({
    apiKey: process.env.OPENAPI_API_KEY,
})

console.log(" Open AI "+ openai)

// Used when grabbing data.
function Spinner(){
    return <div>Loading... </div>;
}

// process information from the destructure object parameter
function FlightCard({ flightInfo }){
    return(
        <div>
            <h2>Flight Information</h2>
            <p> Flight Number: {flightInfo.flightNumber}</p>
            <p> Departure: {flightInfo.departure}</p>
            <p> Arrival: {flightInfo.arrival}</p>
        </div>
    );
}

// Non dynamic function to get flight info base don flightNumber input
async function getFlightInfo(flightNumber: string){
    return {
        flightNumber,
        departure: "New York : JUST TESTING",
        arrival: "San Francisco: JUST TESTING",
    };
}
// Create a streaming UI node. You can make as many as you need.
async function getStockHistoryChart() {
    'use server';
   
    const ui = createStreamableUI(<Spinner />);
   
    // We need to wrap this in an async IIFE to avoid blocking. Without it, the UI wouldn't render
    // while the fetch or LLM call are in progress.
    (async () => {
      const price = await callLLM('What is the current stock price of AAPL?');
   
      // Show a spinner as the history chart for now.
      // We won't be updating this again so we use `ui.done()` instead of `ui.update()`.
      const historyChart = createStreamableUI(<Spinner />);
      ui.done(<StockCard historyChart={historyChart.value} price={price} />);
   
      // Getting the history data and then update that part of the UI.
      const historyData = await fetch('https://my-stock-data-api.com');
      historyChart.done(<HistoryChart data={historyData} />);
    })();
   
    return ui;
  }

async function handleUserMessage(userInput) {
    'use server';
    const card = createStreamableUI(<Spinner />);
   
    async function getCityWeather() {
      try {
        card.update(
          <>
            Analyzing...
            <WeatherCardSkeleton />
          </>,
        );
   
        // Your customized LLM logic, e.g. tools API.
        const res = await callLLM(
          `Return the city name from the user input: ${userInput}`,
        );
   
        const temperature = await getCityTemperature(res.city);
        card.done(
          <>
            Here's the weather of {res.city}:
            <WeatherCard
              city={res.city}
              temperature={temperature}
              refreshAction={async () => {
                'use server';
                return getCityTemperature(res.city);
              }}
            />
          </>,
        );
      } catch {
        card.done(<ErrorCard />);
        tokenCounter.done(0);
      }
    }
   
    getCityWeather();
   
    return {
      startedAt: Date.now(),
      ui: card.value, // Streamed UI value
      tokens: tokenCounter.value, // Extra meta information.
    };
  }

// This is the main function that is to communicate to the AI system.
async function submitUserMessage(userInput: string) {
    'use server';

    const aiState = getMutableAIState<typeof AI>();

    aiState.update([
        ...aiState.get(),
        {
            role: 'user',
            content: userInput,
        },
    ]);

    const ui = render({
        mode: 'gpt-4-0125-preview',
        provider: openai,
        messages: [
            {role: 'system', content: 'You are a flight assistant'},
            ...aiState.get()
        ],

        text: ({content,done}) => {
            if(done){
                aiState.done([
                    ...aiState.get(),
                    {
                        role: "assistant",
                        content
                    }
                ]);
            }

            return <p> {content} </p>
        },
        tools: {
            get_flight_info: {
                description: 'Get the information for a flight',
                parameters: z.object({
                    flightNumber: z.string().describe('the number of the flight')
                }).required(),
                render: async function* ({ flightNumber }){
                    yield <Spinner/>
                    const flightInfo = await getFlightInfo(flightNumber)

                    aiState.done([
                        ...aiState.get(),
                        {
                            role: "function",
                            name: "get_flight_info",
                            content: JSON.stringify(flightInfo),
                        }
                    ]);

                    return <FlightCard flightInfo={flightInfo} />
                }
            }
        }
    })

    return {
        id: Date.now(),
        display: ui
    };
}

const initialAIState: {
    role: 'user' | 'assistant' | 'system' | 'function';
    content: string;
    id?: string;
    name?: string;
}[] = [];


const initialUIState:{
    id: number;
    display: React.ReactNode;
}[] = [];

export const AI = createAI({
    actions: {
        submitUserMessage
    },

    initialUIState,
    initialAIState
})




