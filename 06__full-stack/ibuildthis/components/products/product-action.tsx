'use server'
import { auth } from "@clerk/nextjs/server";
import { log } from "console";

type FormState = {
    success: boolean,
    error: Record<string, string[]>,
    message: string

}

export async function addProductAction(prevState: FormState, formdata: FormData) {
    log(formdata)
    try {
        const {userId} = await auth()
        if(!userId){
            return {
                success: false,
                message: "You must be signed in to submit the form"
            }
        }
        const rawFormData = Object.fromEntries(formdata.entries())
        
    } catch (error) {
        
    }

    return {
        success: true,
        error: {},
        message: 'Product submitted successfully!'
    }
}