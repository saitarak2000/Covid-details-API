const express = require("express");

const app = express();

app.use(express.json());

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const dbpath = path.join(__dirname, "covid19India.db");

let db = null;

const intializedbandserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`error occurred ${e}`);
    process.exit(1);
  }
};
intializedbandserver();

const convertocamelcase = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

app.get("/states/", async (request, response) => {
  const query = `select * from state;`;
  const data = await db.all(query);
  response.send(data.map((eachitem) => convertocamelcase(eachitem)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `select * from state where state_id=${stateId};`;
  const data = await db.get(query);
  response.send(convertocamelcase(data));
});

app.post("/districts/", async (request, response) => {
  const districtdetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtdetails;
  const query = `insert into district (district_name,state_id,cases,cured,active,deaths) 
                  values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;

  const data = await db.run(query);
  response.send("District Successfully Added");
});

const convertcamelcasedistrict = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `select * from district where district_id=${districtId}`;
  const data = await db.get(query);
  response.send(convertcamelcasedistrict(data));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `delete from district where district_id=${districtId}`;
  await db.run(query);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtdetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtdetails;
  const query = `update district set
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths} where district_id=${districtId};`;
  await db.run(query);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `select sum(cases) as totalCases,
                   sum(cured) as totalCured,
                   sum(active) as totalActive,
                    sum(deaths) as totalDeaths from district where state_id=${stateId};`;
  const data = await db.get(query);
  response.send(data);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const query = `select state.state_name as stateName 
                 from state 
                 NATURAL JOIN district 
                 where district_id=${districtId};`;
  const data = await db.get(query);
  response.send(data);
});

module.exports = app;
