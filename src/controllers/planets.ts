import Joi from "joi";
import { Request, Response } from "express";
import pgPromise from "pg-promise";

const db = pgPromise()("postgres://postgres:postgres@localhost:5432/postgres");
console.log(db)

const setupDb = async () => {
  await db.none(`
   DROP TABLE IF EXISTS planets;

   CREATE TABLE planets(
      id SERIAL NOT NULL PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT
   );
  `);

  await db.none(`INSERT INTO planets (name) VALUES ('Terra')`);
  await db.none(`INSERT INTO planets (name) VALUES ('marte')`);
  
};

setupDb();

const getAll = async (req: Request, res: Response) => {
  const planets= await db.many(`SELECT * FROM planets;`)
  res.status(200).json(planets);  
};

const getOneById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const planet= await db.oneOrNone(`SELECT * FROM planets WHERE id=$1;`, Number(id))
  res.status(200).json(planet);
};

const planetSchema = Joi.object({
  id: Joi.number().integer(),
  name: Joi.string(),
});

const create = async (req: Request, res: Response) => {
  const { name } = req.body;
  const newPlanet = { name };
  const validatedNewPlanet = planetSchema.validate(newPlanet);

  if (validatedNewPlanet.error) {
    return res.status(400).json({ msg: validatedNewPlanet.error.details[0].message });
  } else {
    await db.none('INSERT INTO planets (name) VALUES ($1)', name)
    res.status(201).json({ msg: "the planet was created" });
  }
};

const updateById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
await db.none('UPDATE planets SET name=$2 WHERE id=$1', [id , name])
  res.status(200).json({ msg: "the planet was updated" });
};

const deliteById = async (req: Request, res: Response) => {
  const { id } = req.params;
 await db.none('DELETE FROM planets WHERE id=$1', Number(id))
  res.status(200).json({ msg: "the planet was deleted" });
};

const createImage = async (req: Request, res: Response) => {
  console.log(req.file)
  const {id} = req.params;
  const filename = req.file?.path;

  if(filename){
    db.none('UPDATE planets SET image=$2 WHERE id=$1', [id, filename])
    res.status(201).json({ msg: "planet image uploaded successfully" });
  }else{
    res.status(400).json({msg:"planet image failed to upload"})
  }
}


export { getAll, getOneById, create, updateById, deliteById, createImage};