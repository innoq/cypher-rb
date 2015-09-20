# cypher-rb
JavaScript library to use cypher directly from (static) HTML pages to query Neo4j data.

## Basic idea

### Sample 1: Create data table by cypher query.

Fill a HTML table with a cypher query. Tables with class `cypher-table` will be checked for `data-query` attribute. The 
corresponding query is executed and the table filled with the results. 
```
<table class="cypher-table" 
       data-query="MATCH (p:Person) OPTIONAL MATCH p-->(e:Engagement)-->(r:Project)-[:HAS_CUSTOMER]->(c:Organisation)                             WHERE e.end > @today 
                  RETURN p.fullname as Name, p.username as ID, 
                         collect(r.name) as `Current Projects`, c.name as Customer 
                  ORDER BY p.fullname", {today: '2015-09-20' })">
</table>
```

### Sample 2: Bind form to cypher query to execute updates.

Put a button classed as `inline-submit` inside a form and add a cypher query to `data-exec` attribute. The forms fields will be injected in the query. Use @field for values that need to be quoted and #field for unquoted values.

```
<form class="form-inline">
  <div class="form-group">
    <label for="pr-name">Name</label>
    <input id="pr-name" type="text" name="name" class="form-control"/>
  </div>
  <div class="form-group">
    <label for="pr-customer">Customer</label>
    <input id="pr-customer" type="text" name="customer" class="form-control"/>
  </div>
  <div class="form-group">
    <label for="pr-acm">Account manager</label>
    <input id="pr-acm" type="text" name="acm" class="form-control rb-suggest"
          data-query="MATCH (p:Person) WHERE lower(p.fullname) =~ @term OR lower(p.username) =~ @term
                 RETURN p.username as value, p.fullname as label"/>
  </div>
  <button class="inline-submit btn btn-primary"
          data-exec="MATCH (p:Person) WHERE p.username = @acm
                CREATE (p:Project { name: @name, customer: @customer })-[:HAS_ACCOUNT_MANAGER]->(p)"
          data-onsuccess="updateProjectsTable">
    Add project
  </button>
</form>
```


