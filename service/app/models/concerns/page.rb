class Page
  def initialize(content, page, per_page, total)
    @content = content
    @page = page
    @per_page = per_page
    @total = total
  end

  def content
    @content
  end

  def content=(content)
    @content = content
  end

  def page
    @page
  end

  def page=(page)
    @page = page
  end

  def per_page
    @per_page
  end

  def per_page=(per_page)
    @per_page = per_page
  end

  def total
    @total
  end

  def total=(total)
    @total = total
  end
end
