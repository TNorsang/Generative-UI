import { OpenAI } from "openai";
import { createAI, getMutableAIState, render } from "ai/rsc";
import { z } from "zod";

// Grabbing the open ai key from process.env
const openai = new OpenAI({
    apiKey: process.env.OPENAPI_API_KEY,
})

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

// This is the main function that is to communicate to the AI system.
async function submitUserMessage(userInput: string) {
    'user server';

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




