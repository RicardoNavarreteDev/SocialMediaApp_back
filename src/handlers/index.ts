import e, { Request, Response } from "express"
import { validationResult } from "express-validator"
import slugify from "slugify"
import formidable from "formidable"
import {v4 as uuid} from "uuid"
import User from "../models/User"
import { checkPassword, hashPassword } from "../utils/auth"
import { generateJWT } from "../utils/jwt"
import cloudinary from "../config/cloudinary"

export const createAccount = async (req: Request, res: Response) => {
    const {email, password} = req.body

    const userExist = await User.findOne({email})
        if(userExist) {
            const error = new Error("El usuario ya existe")
            res.status(409).json({error: error.message})
            return 
        }

        const handle = slugify(req.body.handle, '')
        const handleExist = await User.findOne({handle})
        if(handleExist) {
            const error = new Error("El nombre de usuario no esta disponible")
            res.status(409).json({error: error.message})
            return 
        }
    

        const user = new User(req.body)
        user.password = await hashPassword(password)
        user.handle = handle
        
        await user.save()
        res.status(201).send('Usuario creado correctamente')
        return
}

export const login = async (req: Request, res: Response) => { 

    //Manejar errores de validación
    let errors = validationResult(req)
        if(!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()})
            return
        }

    const {email, password} = req.body

    //comprobar usuario    
    const user = await User.findOne({email})
        if(!user) {
            const error = new Error("El usuario no existe")
            res.status(404).json({error: error.message})
            return 
        }
    //comprobar contraseña
    const isPasswordCorrect = await checkPassword(password, user.password)
    if(!isPasswordCorrect) {
        const error = new Error("La contraseña no es correcta")
        res.status(401).json({error: error.message})
        return 
    }
    const token = generateJWT({id:user.id})
    res.send(token)
}

export const getUser = async (req: Request, res: Response) => {
   res.json(req.user)
}

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const {description, links} = req.body
        const handle = slugify(req.body.handle, '')
        const handleExist = await User.findOne({handle})
        if(handleExist && handleExist.email !== req.user.email) {
            const error = new Error("El nombre de usuario no esta disponible")
            res.status(409).json({error: error.message})
            return 
        }
        //Actualizar usuario
        req.user.description = description
        req.user.handle = handle
        req.user.links = links
        await req.user.save()
        res.send('Perfil actualizado correctamente')
    } catch (e) {
        const error = new Error("No se ha podido actualizar el perfil")
        res.status(500).json({error: error.message})
        return
    }
}

export const uploadImage = async (req: Request, res: Response) => {

    const form = formidable({multiples: false})
    try {        
        form.parse(req, (error, fields, files) =>{
            cloudinary.uploader.upload(
              files.file[0].filepath,
              {public_id: uuid()},
              async function (error, result) {
                  if(error) {
                      const error = new Error("No se ha podido subir la imagen")
                      res.status(500).json({error: error.message})
                      return
                  }
                  if(result){
                    req.user.image = result.secure_url
                    await req.user.save()
                    res.json({image: result.secure_url})
                  }
              });
    })
    } catch (e) {
        const error = new Error("No se ha podido subir la imagen")
        res.status(500).json({error: error.message})
        return
    }
}

export const getUserByHandle = async (req: Request, res: Response) => {
    try {
        const {handle} = req.params
        const user = await User.findOne({handle}).select('-_id -__v -email -password')
        
        if(!user){
            const error = new Error("El usuario no existe")
            res.status(404).json({error: error.message})
            return
        }
        res.json(user)
    } catch (e) {
        const error = new Error("Hubo un error")
        res.status(500).json({error: error.message})
        return
    }
}

export const searchByHandle = async (req: Request, res: Response) => {
    try {
        const {handle} = req.body
        const userExist = await User.findOne({handle})
        if(userExist){
            const error = new Error(`${handle} ya esta registrado`)
            res.status(409).json({error: error.message})
            return
        }
        res.send(`${handle} esta disponible`)
    } catch (e) {
        const error = new Error("Hubo un error")
        res.status(500).json({error: error.message})
        return
    }
}