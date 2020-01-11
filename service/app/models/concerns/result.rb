class Result
  def initialize(code, message, data)
    @code = code
    @message = message
    @data = data
  end

  def to_model
    return Hash[:code => @code, :message => @message, :data => @data]
  end

  def code
    @code
  end

  def code=(code)
    @code = page
  end

  def message
    @message
  end

  def message=(message)
    @message = page
  end

  def data
    @data
  end

  def data=(data)
    @data = data
  end
end
