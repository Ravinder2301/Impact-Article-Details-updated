const { queryDatabase } = require('../db');

const getPublications = async (req, res) => {
  try {
    const query = `
      SELECT pm.Title AS PublicationTitle, pl.Name AS Edition
      FROM pub_master pm
           JOIN picklist pl ON pm.Place = pl.ID;
    `;

    const results = await queryDatabase(query);
    res.status(200).json(results);
  } catch (error) {
    // console.error("Error fetching publications:", error);
    res.status(500).json({ error: error });
  }
};

module.exports = { getPublications };
