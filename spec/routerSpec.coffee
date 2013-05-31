Router = (require '../lib/router').Router

describe 'isRouter', ->

  it 'given undefined should return false', ->
    expect(Router.isRouter undefined).toBe false

  it 'given null should return false', ->
    expect(Router.isRouter null).toBe false