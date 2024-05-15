import { Schema } from "redis-om";


export const countrySchema = new Schema(
    'country',
    {
        id: {type : 'number'},
        name: {type : 'string'},
        capital: {type : 'string'},
        remarks: {type : 'string'},
        creation_date: {type : 'date'}
    },
    {
        dataStructure: 'JSON'
    }
)