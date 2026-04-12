module.exports = function validate(schema, source = "body") {
  return (req, res, next) => {
    const data =
      source === "query"
        ? req.query
        : source === "params"
          ? req.params
          : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: true,
      convert: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (source === "query") {
      req.validatedQuery = value;
    } else if (source === "params") {
      req.validatedParams = value;
    } else {
      Object.assign(req.body, value);
    }

    next();
  };
};
