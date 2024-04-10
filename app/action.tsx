import { OpenAI } from "openai";
import { createAI, getMutableAIState, render } from "ai/rsc";
import { z } from "zod";

const openai = new OpenAI({
    apiKey: process.env.OPENAPI_API_KEY,
})

function Spinner(){
    return <div>Loading... </div>;
}

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

async function getFlightInfo(flightNumber: string){
    return {
        flightNumber,
        departure: "New York : JUST TESTING",
        arrival: "San Francisco: JUST TESTING",
    };
}

async function submitUserMessage(userInput: string) {
    'user server';

    const aiState = getMutableAIState<typeof AI>();


}

