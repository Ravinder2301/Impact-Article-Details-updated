const { queryDatabase } = require('../db');

// Get articles based on pubdate, pub, and edition
const getArticles = async (req, res) => {
  try {
    const { pubdate, pub, edition } = req.body;
    if (!pubdate || !pub) {
      return res.status(400).json({ error: 'Publication date, title, and edition are required' });
    }

    // const query = `
    //   SELECT 
    //     sub.PublicationTitle,
    //     sub.Edition,
    //     sub.pubdate,
    //     sub.TotalArticles,
    //     ai.Page_Number,
    //     COUNT(ai.ArticleID) AS ArticlesOnPage
    //   FROM 
    //     article a
    //   JOIN 
    //     pub_master pm ON a.PubID = pm.Pubid
    //   JOIN 
    //     picklist pl ON pm.Place = pl.ID
    //   JOIN 
    //     (SELECT 
    //        pm.Title AS PublicationTitle, 
    //        pl.Name AS Edition, 
    //        a.pubdate, 
    //        COUNT(a.ArticleID) AS TotalArticles
    //      FROM 
    //        article a
    //      JOIN 
    //        pub_master pm ON a.PubID = pm.Pubid
    //      JOIN 
    //        picklist pl ON pm.Place = pl.ID
    //      WHERE 
    //        a.pubdate = ?  
    //        AND pm.Title = ?  
    //        AND pl.Name = ?  
    //      GROUP BY 
    //        pm.Title, pl.Name, a.pubdate) sub 
    //   ON 
    //     pm.Title = sub.PublicationTitle 
    //     AND pl.Name = sub.Edition 
    //     AND a.pubdate = sub.pubdate
    //   LEFT JOIN 
    //     article_image ai ON a.ArticleID = ai.ArticleID
    //   WHERE 
    //     a.pubdate = ?  
    //     AND pm.Title = ?  
    //     AND pl.Name = ?  
    //   GROUP BY 
    //     sub.PublicationTitle, 
    //     sub.Edition, 
    //     sub.pubdate, 
    //     ai.Page_Number
    //   ORDER BY 
    //     cast(ai.Page_Number as unsigned);
    // `;

    const query = `
      SELECT 
    sub.PublicationTitle,
    sub.Edition,
    sub.pubdate,
    sub.TotalArticles,
    ai.Page_Number,
    page_count.ArticlesOnPage,  -- Number of articles per page
    	a.ArticleID,                -- Include the ArticleID
    a.Title AS ArticleTitle
FROM 
    article a
JOIN 
    pub_master pm ON a.PubID = pm.Pubid
JOIN 
    picklist pl ON pm.Place = pl.ID
JOIN 
    (
        SELECT 
            pm.Title AS PublicationTitle, 
            pl.Name AS Edition, 
            a.pubdate,
            COUNT(a.ArticleID) AS TotalArticles
        FROM 
            article a
        JOIN 
            pub_master pm ON a.PubID = pm.Pubid
        JOIN 
            picklist pl ON pm.Place = pl.ID
        WHERE 
            a.pubdate = ?  
            AND pm.Title = ?  
            AND pl.Name = ?  
        GROUP BY 
            pm.Title, pl.Name, a.pubdate
    ) sub ON pm.Title = sub.PublicationTitle 
          AND pl.Name = sub.Edition 
          AND a.pubdate = sub.pubdate
LEFT JOIN 
    article_image ai ON a.ArticleID = ai.ArticleID  -- Join with article_image to get the page_number
LEFT JOIN 
    (
        -- Subquery to calculate the number of articles on each page
        SELECT 
            ai.Page_Number,
            COUNT(a.ArticleID) AS ArticlesOnPage
        FROM 
            article a
        LEFT JOIN 
            article_image ai ON a.ArticleID = ai.ArticleID
        JOIN
            pub_master pm ON a.PubID = pm.Pubid  -- Ensure that pub_master is joined here
        JOIN
            picklist pl ON pm.Place = pl.ID      -- Ensure picklist is joined here
        WHERE 
            a.pubdate = ?  
            AND pm.Title = ?  
            AND pl.Name = ?
        GROUP BY 
            ai.Page_Number
    ) page_count ON ai.Page_Number = page_count.Page_Number  -- Join to get article count per page
WHERE 
    a.pubdate = ?  
    AND pm.Title = ?  
    AND pl.Name = ? 
ORDER BY 
cast(ai.Page_Number as unsigned);
`;
// ai.Page_Number, a.Title;  -- Order by page number and article title;

    const results = await queryDatabase(query, [pubdate, pub, edition, pubdate, pub, edition, pubdate, pub, edition]);
    res.status(200).json(results);
  } catch (error) {
    // console.error('Server error:', error);
    res.status(500).json({ error: error });
  }
};

// Get articles by page number
const getArticlesByPageNo = async (req, res) => {
  try {
    const { pubdate, pub, edition, pageNumber } = req.body;
    if (!pubdate || !pub || !pageNumber) {
      return res.status(400).json({ error: 'Publication date, title, and edition are required' });
    }

    const query = `
      SELECT 
        a.ArticleID,
        a.Title AS ArticleTitle,
        ai.Page_Number
      FROM 
        article a
      JOIN 
        pub_master pm ON a.PubID = pm.Pubid
      JOIN 
        picklist pl ON pm.Place = pl.ID
      JOIN 
        article_image ai ON a.ArticleID = ai.ArticleID
      WHERE 
        a.pubdate = ?  
        AND pm.Title = ?  
        AND pl.Name = ?  
        AND ai.Page_Number = ?;
    `;

    const results = await queryDatabase(query, [pubdate, pub, edition, pageNumber]);
    res.status(200).json(results);
  } catch (error) {
    // console.error('Server error:', error);
    res.status(500).json({ error: error });
  }
};

// Get full text by article ID
const getFullTextById = async (req, res) => {
  try {
    const { articleID } = req.body;
    if (!articleID) {
      return res.status(400).json({ error: 'Article ID is required' });
    }

    const query = `
      SELECT 
        a.ArticleID,
        a.pubdate,
        a.PubID,
        a.Num_pages,
        a.Title AS ArticleTitle,
        a.Sub_Title,
        a.IsColor,
        a.IsPhoto,
        a.UserID,
        a.IsPremium,
        a.ave,
        a.lastupdated,
        a.sq_allocatedDateTime,
        a.Date_Time_Acqured,
        a.md5id,
        ai.Page_Number,
        ai.pagename,
        ai.full_text,
        ai.imagedirectory,
        ai.Image_name,
        ai.start_acq_time,
        ai.end_acq_time,
        ak.keyid,
        km.PrimarykeyID,
        CONCAT(km.KeyWord, 
               CASE 
                   WHEN km.Filter_String IS NOT NULL AND km.Filter_String != '' 
                   THEN CONCAT(':', km.Filter_String) 
                   ELSE '' 
               END) AS MergedKeywordFilter,
        pm.Title AS PublicationTitle,
        s.Name AS SectorName,
        j.Fname,
        j.Lname
      FROM 
        article a
      JOIN 
        article_image ai ON a.ArticleID = ai.ArticleID
      LEFT JOIN 
        article_keyword ak ON a.ArticleID = ak.articleid
      LEFT JOIN 
        keyword_master km ON ak.keyid = km.keyID
      LEFT JOIN 
        pub_master pm ON a.PubId = pm.PubId
      LEFT JOIN 
        picklist s ON a.SectorPid = s.ID
      LEFT JOIN 
        article_journalist aj ON a.ArticleID = aj.ArticleID
      LEFT JOIN 
        journalist j ON aj.JournalistID = j.JourID
      WHERE 
        a.ArticleID = ?;
    `;

    const results = await queryDatabase(query, [articleID]);

    // Handle special characters in full text and other fields
    const handleSpecialCharacters = (text) => {
      let correctedText = text
        .replace(/â€¢/g, '•')
        .replace(/â€”/g, '—')
        .replace(/â€“/g, '–')
        .replace(/â€œ/g, '“')
        .replace(/â€˜/g, '‘')
        .replace(/â€™/g, '’')
        .replace(/â€/g, '”')
        .replace(/â€¦/g, '…')
        .replace(/Â°/g, '°')
        .replace(/â€“/g, '–')
        .replace(/â‚¬/g, '€')
        .replace(/\*/g, "'")
        .replace(/ï¿½/g, "'");

      return correctedText;
    };

    if (results.length > 0) {
      results.forEach((text) => {
        text.full_text = handleSpecialCharacters(text.full_text);
        text.ArticleTitle = handleSpecialCharacters(text.ArticleTitle);
        text.Sub_Title = handleSpecialCharacters(text.Sub_Title);
      });
    }

    res.status(200).json(results);
  } catch (error) {
    // console.error('Server error:', error);
    res.status(500).json({ error: error });
  }
};

const getFilterString = async (req, res) => {
    try {
      const { PrimarykeyID } = req.body
  
      // if (!PrimarykeyID) {
      //   return res.status(400).json({ error: 'PrimaryKeyID is required' });
      // }
  
      const query = `SELECT Filter_String, keyid FROM keyword_master where PrimarykeyID = ? `;
  
      // Execute the query with parameterized values
      const results = await queryDatabase(query, [PrimarykeyID]);
  
      // Send the results as a JSON response
      res.status(200).json(results);
    } catch (error) {
      // console.error('Server error:', error);  // More detailed logging
      res.status(500).json({ error: error });
    }
}

const editArticle = async (req, res) => {
    try {
      // const { id } = req.params;
      const { id, title, sub_title, isPremium, isColor, isPhoto } = req.body;
  
      // Build the query dynamically based on which fields are provided
      let query = 'UPDATE article SET';
      const params = [];
  
      if (title !== undefined) {
        query += ' Title = ?';
        params.push(title);
      }
  
      if (sub_title !== undefined) {
        if (params.length > 0) query += ',';
        query += ' Sub_Title = ?';
        params.push(sub_title);
      }
  
      if (isPremium !== undefined) {
        if (params.length > 0) query += ',';
        query += ' IsPremium = ?';
        params.push(isPremium);
      }
  
      if (isPhoto !== undefined) {
        if (params.length > 0) query += ',';
        query += ' IsPhoto = ?';
        params.push(isPhoto);
      }
  
      if (isColor !== undefined) {
        if (params.length > 0) query += ',';
        query += ' IsColor = ?';
        params.push(isColor);
      }
  
      // Append WHERE clause
      query += ' WHERE ArticleID = ?';
      params.push(id);
  
      // Execute the query with parameterized values
      const results = await queryDatabase(query, params);

      res.status(200).json({ message: "Successfully article updated", results: results });
  
    } catch (error) {
      // console.error('Server error:', error); // More detailed logging
      res.status(500).json({ error: error });
    }
}

const editPage = async (req, res) => {
    try {
      // const { id } = req.params;
      const {id, old_page_number, new_page_number, page_name } = req.body;
  
      // Build the query dynamically based on which fields are provided
      let query = 'UPDATE article_image SET';
      const params = [];
  
      if (new_page_number !== undefined) {
        query += ' Page_Number = ?';
        params.push(new_page_number);
      }
  
      if (page_name !== undefined) {
        if (params.length > 0) query += ',';
        query += ' pagename = ?';
        params.push(page_name);
      }
  
      // Append WHERE clause
      query += ' WHERE ArticleID = ? and Page_Number = ?';
      params.push(id, old_page_number);
  
      // Execute the query with parameterized values
      const results = await queryDatabase(query, params);
  
      res.status(200).json({ message: "Successfully page updated", results: results });
  
    } catch (error) {
      // console.error('Server error:', error); // More detailed logging
      res.status(500).json({ error: error });
    }
}

const editJour = async (req, res) => {
    try {
      const { id, fname, lname } = req.body;
      console.log(fname, lname);
  
      // if (fname == null && lname == null) {
      //   return res.status(400).json({ message: "No fields to update" });
      // }
  
      // Start building the update query
      let query = 'UPDATE journalist j JOIN article_journalist aj ON j.jourId = aj.JournalistID SET';
      const params = [];
  
      if (fname !== undefined) {
        query += ' j.Fname = ?';
        params.push(fname);
      }
  
      if (lname !== undefined) {
        if (params.length > 0) query += ',';
        query += ' j.Lname = ?';
        params.push(lname);
      }
  
      // Append WHERE clause
      query += ' WHERE aj.ArticleID = ?';
      params.push(id);
  
      // Execute the query with parameterized values
      const results = await queryDatabase(query, params);
  
      res.status(200).json({ message: "Successfully updated journalist", results: results });
  
    } catch (error) {
      // console.error('Server error:', error);
      res.status(500).json({ error: error });
    }
}

module.exports = { getArticles, getArticlesByPageNo, getFullTextById, getFilterString, editArticle, editPage, editJour };
